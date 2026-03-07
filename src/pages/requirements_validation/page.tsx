import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import SmartTable from 'src/components/SmartTable'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomTag from 'src/components/custom/CustomTag'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomDivider from 'src/components/custom/CustomDivider'
import StateSelector from 'src/components/StateSelector'
import ConditionalComponent from 'src/components/ConditionalComponent'
import CustomTabs from 'src/components/custom/CustomTabs'
import ModuleSummary from 'src/components/ModuleSummary'
import { ColumnsType } from 'antd/lib/table'
import { useRequirementStore } from 'src/store/requirement.store'
import { Requirement } from 'src/services/requirements/requirement.types'
import { useGetRequirementPaginationMutation } from 'src/services/requirements/useGetRequirementPaginationMutation'
import { useUpdateRequirementMutation } from 'src/services/requirements/useUpdateRequirementMutation'
import { useStudentRequirementStore } from 'src/store/student-requirement.store'
import { StudentRequirement } from 'src/services/student-requirements/student-requirement.types'
import { useGetStudentRequirementPaginationMutation } from 'src/services/student-requirements/useGetStudentRequirementPaginationMutation'
import { useUpdateStudentRequirementMutation } from 'src/services/student-requirements/useUpdateStudentRequirementMutation'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import formatter from 'src/utils/formatter'
import { CustomText } from 'src/components/custom/CustomParagraph'
import RequirementForm from './components/RequirementForm'
import StudentRequirementForm from './components/StudentRequirementForm'
import { requirementStatusOptions } from './constants'

const requirementInitialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const validationInitialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const RequirementsSection: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Requirement>()
  const debounce = useDebounce(searchKey)
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const { requirements, metadata } = useRequirementStore()
  const { mutate: getRequirements, isPending } =
    useGetRequirementPaginationMutation()
  const { mutateAsync: updateRequirement, isPending: isUpdatePending } =
    useUpdateRequirementMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = requirementInitialFilter.FILTER } =
        form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: ['REQUIREMENT_KEY', 'NAME', 'DESCRIPTION'],
        })
      }

      getRequirements({ page, size, condition })
    },
    [debounce, form, metadata.currentPage, metadata.pageSize, getRequirements]
  )

  useEffect(handleSearch, [handleSearch])

  const handleToggleState = (record: Requirement) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } el requisito "${record.NAME}"?`,
      onOk: async () => {
        try {
          await updateRequirement({
            REQUIREMENT_ID: record.REQUIREMENT_ID,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          } as Requirement)
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<Requirement> = useMemo(
    () => [
      {
        dataIndex: 'REQUIREMENT_KEY',
        key: 'REQUIREMENT_KEY',
        title: 'Clave',
      },
      {
        dataIndex: 'NAME',
        key: 'NAME',
        title: 'Nombre',
      },
      {
        dataIndex: 'IS_REQUIRED',
        key: 'IS_REQUIRED',
        title: 'Obligatorio',
        render: (value: boolean) => (
          <CustomTag color={value ? 'green' : 'default'}>
            {value ? 'Sí' : 'No'}
          </CustomTag>
        ),
      },
      {
        dataIndex: 'DESCRIPTION',
        key: 'DESCRIPTION',
        title: 'Descripción',
      },
    ],
    []
  )

  const filter = (
    <CustomRow gutter={[8, 8]}>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Estado'}
          name={['FILTER', 'STATE__IN']}
          labelCol={{ span: 24 }}
        >
          <StateSelector />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  return (
    <>
      <SmartTable
      exportable
        form={form}
        rowKey="REQUIREMENT_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={requirements}
        metadata={metadata}
        createText={'Nuevo requisito'}
        searchPlaceholder={'Buscar requisitos...'}
        onCreate={() => {
          setEditing(undefined)
          setModalOpen(true)
        }}
        onChange={handleSearch}
        onSearch={setSearchKey}
        onEdit={(record) => {
          setEditing(record)
          setModalOpen(true)
        }}
        onUpdate={handleToggleState}
        filter={filter}
        initialFilter={requirementInitialFilter}
      />

      <ConditionalComponent condition={modalOpen}>
        <RequirementForm
          open={modalOpen}
          requirement={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(undefined)
          }}
          onSuccess={() => {
            handleSearch()
            setEditing(undefined)
          }}
        />
      </ConditionalComponent>
    </>
  )
}

const ValidationSection: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StudentRequirement>()
  const debounce = useDebounce(searchKey)
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const { studentRequirements, metadata, summary } =
    useStudentRequirementStore()
  const { mutate: getValidations, isPending } =
    useGetStudentRequirementPaginationMutation()
  const { mutateAsync: updateValidation, isPending: isUpdatePending } =
    useUpdateStudentRequirementMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = validationInitialFilter.FILTER } =
        form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: 'FILTER',
        })
      }

      getValidations({ page, size, condition })
    },
    [debounce, form, metadata.currentPage, metadata.pageSize, getValidations]
  )

  useEffect(handleSearch, [handleSearch])

  const handleToggleState = (record: StudentRequirement) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } la validación?`,
      onOk: async () => {
        try {
          await updateValidation({
            STUDENT_REQUIREMENT_ID: record.STUDENT_REQUIREMENT_ID,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          } as StudentRequirement)
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<StudentRequirement> = useMemo(
    () => [
      {
        dataIndex: 'STUDENT',
        key: 'STUDENT',
        title: 'Becario',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{`${record.NAME} ${record.LAST_NAME}`}</CustomText>
            <CustomText type="secondary">
              {formatter({
                value: record.IDENTITY_DOCUMENT,
                format: 'document',
              })}
            </CustomText>
          </CustomSpace>
        ),
      },
      {
        dataIndex: 'REQUIREMENT',
        key: 'REQUIREMENT',
        title: 'Requisito',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{record.REQUIREMENT_NAME}</CustomText>
            <CustomText type="secondary">
              {record.REQUIREMENT_KEY}
            </CustomText>
          </CustomSpace>
        ),
      },
      {
        dataIndex: 'STATUS',
        key: 'STATUS',
        title: 'Estado',
        render: (value: string) => {
          const option = requirementStatusOptions.find(
            (item) => item.value === value
          )
          return (
            <CustomTag color={option?.color as never}>
              {option?.label ?? value}
            </CustomTag>
          )
        },
      },
      {
        dataIndex: 'VALIDATED_AT',
        key: 'VALIDATED_AT',
        title: 'Validado',
        render: (value) =>
          value ? formatter({ value, format: 'datetime' }) : 'Pendiente',
      },
      {
        dataIndex: 'OBSERVATION',
        key: 'OBSERVATION',
        title: 'Observación',
        render: (value) => value || '—',
      },
    ],
    []
  )

  const filter = (
    <CustomRow gutter={[8, 8]}>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Estado del registro'}
          name={['FILTER', 'STATE__IN']}
          labelCol={{ span: 24 }}
        >
          <StateSelector />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Estado de validación'}
          name={['FILTER', 'STATUS__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar estados"
            allowClear
            options={requirementStatusOptions}
          />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  const summaryData = useMemo(
    () =>
      requirementStatusOptions.map((option) => ({
        key: option.value,
        title: option.label,
        value: summary?.[option.value] ?? 0,
      })),
    [summary]
  )

  return (
    <>
      <ModuleSummary total={metadata.totalRows} dataSource={summaryData} />
      <CustomDivider />
      <SmartTable
      exportable
        form={form}
        rowKey="STUDENT_REQUIREMENT_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={studentRequirements}
        metadata={metadata}
        showActions
        createText={'Nueva validación'}
        searchPlaceholder={'Buscar validaciones...'}
        onChange={handleSearch}
        onSearch={setSearchKey}
        onEdit={(record) => {
          setEditing(record)
          setModalOpen(true)
        }}
        onUpdate={handleToggleState}
        filter={filter}
        initialFilter={validationInitialFilter}
      />

      <ConditionalComponent condition={modalOpen}>
        <StudentRequirementForm
          open={modalOpen}
          requirement={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(undefined)
          }}
          onSuccess={() => {
            handleSearch()
            setEditing(undefined)
          }}
        />
      </ConditionalComponent>
    </>
  )
}

const Page: React.FC = () => {
  const items = [
    {
      key: 'requirements',
      label: 'Requisitos',
      children: <RequirementsSection />,
    },
    {
      key: 'validation',
      label: 'Validación',
      children: <ValidationSection />,
    },
  ]

  return <CustomTabs items={items} />
}

export default Page
