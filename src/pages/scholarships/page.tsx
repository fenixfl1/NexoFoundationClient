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
import { useScholarshipStore } from 'src/store/scholarship.store'
import { Scholarship } from 'src/services/scholarships/scholarship.types'
import { useGetScholarshipPaginationMutation } from 'src/services/scholarships/useGetScholarshipPaginationMutation'
import { useUpdateScholarshipMutation } from 'src/services/scholarships/useUpdateScholarshipMutation'
import { useDisbursementStore } from 'src/store/disbursement.store'
import { Disbursement } from 'src/services/disbursements/disbursement.types'
import { useGetDisbursementPaginationMutation } from 'src/services/disbursements/useGetDisbursementPaginationMutation'
import { useUpdateDisbursementMutation } from 'src/services/disbursements/useUpdateDisbursementMutation'
import { useScholarshipCostStore } from 'src/store/scholarship-cost.store'
import { ScholarshipCost } from 'src/services/scholarship-costs/scholarship-cost.types'
import { useGetScholarshipCostPaginationMutation } from 'src/services/scholarship-costs/useGetScholarshipCostPaginationMutation'
import { useUpdateScholarshipCostMutation } from 'src/services/scholarship-costs/useUpdateScholarshipCostMutation'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import formatter from 'src/utils/formatter'
import { CustomText } from 'src/components/custom/CustomParagraph'
import ScholarshipForm from './components/ScholarshipForm'
import DisbursementForm from './components/DisbursementForm'
import ScholarshipCostForm from './components/ScholarshipCostForm'
import {
  scholarshipStatusOptions,
  disbursementStatusOptions,
  scholarshipCostStatusOptions,
  periodTypeOptions,
} from './constants'

const scholarshipInitialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const disbursementInitialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const costInitialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const ScholarshipsSection: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Scholarship>()
  const debounce = useDebounce(searchKey)
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const { scholarships, metadata, summary } = useScholarshipStore()
  const { mutate: getScholarships, isPending } =
    useGetScholarshipPaginationMutation()
  const { mutateAsync: updateScholarship, isPending: isUpdatePending } =
    useUpdateScholarshipMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = scholarshipInitialFilter.FILTER } =
        form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: 'FILTER',
        })
      }

      getScholarships({ page, size, condition })
    },
    [debounce, form, metadata.currentPage, metadata.pageSize, getScholarships]
  )

  useEffect(handleSearch, [handleSearch])

  const handleToggleState = (record: Scholarship) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } la beca?`,
      onOk: async () => {
        try {
          await updateScholarship({
            SCHOLARSHIP_ID: record.SCHOLARSHIP_ID,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          } as Scholarship)
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<Scholarship> = useMemo(
    () => [
      {
        dataIndex: 'STUDENT',
        key: 'STUDENT',
        title: 'Becario',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{`${record.STUDENT_NAME} ${record.STUDENT_LAST_NAME}`}</CustomText>
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
        dataIndex: 'NAME',
        key: 'NAME',
        title: 'Beca',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{record.NAME}</CustomText>
            <CustomText type="secondary">{record.REQUEST_TYPE ?? ''}</CustomText>
          </CustomSpace>
        ),
      },
      {
        dataIndex: 'AMOUNT',
        key: 'AMOUNT',
        title: 'Monto',
        render: (value) => formatter({ value, format: 'currency', prefix: 'RD' }),
      },
      {
        dataIndex: 'STATUS',
        key: 'STATUS',
        title: 'Estado',
        render: (value: string) => {
          const option = scholarshipStatusOptions.find(
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
        dataIndex: 'START_DATE',
        key: 'START_DATE',
        title: 'Inicio',
        render: (value) => formatter({ value, format: 'date' }),
      },
      {
        dataIndex: 'END_DATE',
        key: 'END_DATE',
        title: 'Fin',
        render: (value) =>
          value ? formatter({ value, format: 'date' }) : '—',
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
          label={'Estado de beca'}
          name={['FILTER', 'STATUS__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar estados"
            allowClear
            options={scholarshipStatusOptions}
          />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  const summaryData = useMemo(
    () =>
      scholarshipStatusOptions.map((option) => ({
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
        rowKey="SCHOLARSHIP_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={scholarships}
        metadata={metadata}
        createText={'Nueva beca'}
        searchPlaceholder={'Buscar becas...'}
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
        initialFilter={scholarshipInitialFilter}
      />

      <ConditionalComponent condition={modalOpen}>
        <ScholarshipForm
          open={modalOpen}
          scholarship={editing}
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

const DisbursementsSection: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Disbursement>()
  const debounce = useDebounce(searchKey)
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const { disbursements, metadata, summary } = useDisbursementStore()
  const { mutate: getDisbursements, isPending } =
    useGetDisbursementPaginationMutation()
  const { mutateAsync: updateDisbursement, isPending: isUpdatePending } =
    useUpdateDisbursementMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = disbursementInitialFilter.FILTER } =
        form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: 'FILTER',
        })
      }

      getDisbursements({ page, size, condition })
    },
    [debounce, form, metadata.currentPage, metadata.pageSize, getDisbursements]
  )

  useEffect(handleSearch, [handleSearch])

  const handleToggleState = (record: Disbursement) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } el desembolso?`,
      onOk: async () => {
        try {
          await updateDisbursement({
            DISBURSEMENT_ID: record.DISBURSEMENT_ID,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          } as Disbursement)
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<Disbursement> = useMemo(
    () => [
      {
        dataIndex: 'STUDENT',
        key: 'STUDENT',
        title: 'Becario',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{`${record.STUDENT_NAME} ${record.STUDENT_LAST_NAME}`}</CustomText>
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
        dataIndex: 'SCHOLARSHIP_NAME',
        key: 'SCHOLARSHIP_NAME',
        title: 'Beca',
      },
      {
        dataIndex: 'AMOUNT',
        key: 'AMOUNT',
        title: 'Monto',
        render: (value) => formatter({ value, format: 'currency', prefix: 'RD' }),
      },
      {
        dataIndex: 'DISBURSEMENT_DATE',
        key: 'DISBURSEMENT_DATE',
        title: 'Fecha',
        render: (value) => formatter({ value, format: 'date' }),
      },
      {
        dataIndex: 'STATUS',
        key: 'STATUS',
        title: 'Estado',
        render: (value: string) => {
          const option = disbursementStatusOptions.find(
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
        dataIndex: 'REFERENCE',
        key: 'REFERENCE',
        title: 'Referencia',
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
          label={'Estado del desembolso'}
          name={['FILTER', 'STATUS__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar estados"
            allowClear
            options={disbursementStatusOptions}
          />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  const summaryData = useMemo(
    () =>
      disbursementStatusOptions.map((option) => ({
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
        rowKey="DISBURSEMENT_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={disbursements}
        metadata={metadata}
        createText={'Nuevo desembolso'}
        searchPlaceholder={'Buscar desembolsos...'}
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
        initialFilter={disbursementInitialFilter}
      />

      <ConditionalComponent condition={modalOpen}>
        <DisbursementForm
          open={modalOpen}
          disbursement={editing}
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

const ScholarshipCostsSection: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ScholarshipCost>()
  const debounce = useDebounce(searchKey)
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const { costs, metadata } = useScholarshipCostStore()
  const { mutate: getCosts, isPending } =
    useGetScholarshipCostPaginationMutation()
  const { mutateAsync: updateCost, isPending: isUpdatePending } =
    useUpdateScholarshipCostMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = costInitialFilter.FILTER } = form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: 'FILTER',
        })
      }

      getCosts({ page, size, condition })
    },
    [debounce, form, metadata.currentPage, metadata.pageSize, getCosts]
  )

  useEffect(handleSearch, [handleSearch])

  const handleToggleState = (record: ScholarshipCost) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } el costo del periodo?`,
      onOk: async () => {
        try {
          await updateCost({
            COST_ID: record.COST_ID,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          } as ScholarshipCost)
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<ScholarshipCost> = useMemo(
    () => [
      {
        dataIndex: 'STUDENT',
        key: 'STUDENT',
        title: 'Becario',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{`${record.STUDENT_NAME} ${record.STUDENT_LAST_NAME}`}</CustomText>
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
        dataIndex: 'SCHOLARSHIP_NAME',
        key: 'SCHOLARSHIP_NAME',
        title: 'Beca',
      },
      {
        dataIndex: 'PERIOD_LABEL',
        key: 'PERIOD_LABEL',
        title: 'Periodo',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{record.PERIOD_LABEL}</CustomText>
            <CustomText type="secondary">
              {periodTypeOptions.find((item) => item.value === record.PERIOD_TYPE)
                ?.label ?? record.PERIOD_TYPE}
            </CustomText>
          </CustomSpace>
        ),
      },
      {
        dataIndex: 'AMOUNT',
        key: 'AMOUNT',
        title: 'Monto',
        render: (value) => formatter({ value, format: 'currency', prefix: 'RD' }),
      },
      {
        dataIndex: 'PERIOD_END',
        key: 'PERIOD_END',
        title: 'Fin',
        render: (value) => formatter({ value, format: 'date' }),
      },
      {
        dataIndex: 'STATUS',
        key: 'STATUS',
        title: 'Estado',
        render: (value: string) => {
          const option = scholarshipCostStatusOptions.find(
            (item) => item.value === value
          )
          return (
            <CustomTag color={option?.color as never}>
              {option?.label ?? value}
            </CustomTag>
          )
        },
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
          label={'Estado del costo'}
          name={['FILTER', 'STATUS__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar estados"
            allowClear
            options={scholarshipCostStatusOptions}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Periodo'}
          name={['FILTER', 'PERIOD_TYPE__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar periodo"
            allowClear
            options={periodTypeOptions}
          />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  return (
    <>
      <SmartTable
      exportable
        form={form}
        rowKey="COST_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={costs}
        metadata={metadata}
        createText={'Nuevo costo'}
        searchPlaceholder={'Buscar costos...'}
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
        initialFilter={costInitialFilter}
      />

      <ConditionalComponent condition={modalOpen}>
        <ScholarshipCostForm
          open={modalOpen}
          cost={editing}
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
      key: 'scholarships',
      label: 'Becas',
      children: <ScholarshipsSection />,
    },
    {
      key: 'disbursements',
      label: 'Desembolsos',
      children: <DisbursementsSection />,
    },
    {
      key: 'costs',
      label: 'Costos por periodo',
      children: <ScholarshipCostsSection />,
    },
  ]

  return <CustomTabs items={items} />
}

export default Page
