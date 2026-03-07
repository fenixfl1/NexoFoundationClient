import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import SmartTable from 'src/components/SmartTable'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomTag from 'src/components/custom/CustomTag'
import CustomSpace from 'src/components/custom/CustomSpace'
import ConditionalComponent from 'src/components/ConditionalComponent'
import StateSelector from 'src/components/StateSelector'
import { ColumnsType } from 'antd/lib/table'
import { FollowUp } from 'src/services/follow-up/follow-up.types'
import { useFollowUpStore } from 'src/store/follow-up.store'
import { useGetFollowUpPaginationMutation } from 'src/services/follow-up/useGetFollowUpPaginationMutation'
import { useUpdateFollowUpMutation } from 'src/services/follow-up/useUpdateFollowUpMutation'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import formatter from 'src/utils/formatter'
import FollowUpForm from './components/FollowUpForm'
import capitalize from 'src/utils/capitalize'

const followUpStatusOptions = [
  { label: 'Abierto', value: 'open', color: 'blue' },
  { label: 'Completado', value: 'completed', color: 'green' },
  { label: 'Cancelado', value: 'cancelled', color: 'red' },
]

const initialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const FollowUpPage: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FollowUp>()
  const debounce = useDebounce(searchKey)
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const { followUps, metadata } = useFollowUpStore()
  const { mutate: getFollowUps, isPending } = useGetFollowUpPaginationMutation()
  const { mutateAsync: updateFollowUp, isPending: isUpdatePending } =
    useUpdateFollowUpMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = initialFilter.FILTER } = form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: ['NAME', 'LAST_NAME', 'IDENTITY_DOCUMENT', 'SUMMARY'],
        })
      }

      getFollowUps({ page, size, condition })
    },
    [debounce, form, metadata.currentPage, metadata.pageSize, getFollowUps]
  )

  useEffect(handleSearch, [handleSearch])

  const handleToggleState = async (record: FollowUp) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } el seguimiento?`,
      onOk: async () => {
        try {
          await updateFollowUp({
            FOLLOW_UP_ID: record.FOLLOW_UP_ID,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          } as FollowUp)
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<FollowUp> = useMemo(
    () => [
      {
        dataIndex: 'STUDENT',
        key: 'STUDENT',
        title: 'Becario',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <span>{capitalize(`${record.NAME} ${record.LAST_NAME}`)}</span>
            <span>
              {formatter({
                value: record.IDENTITY_DOCUMENT,
                format: 'document',
              })}
            </span>
          </CustomSpace>
        ),
      },
      {
        dataIndex: 'UNIVERSITY',
        key: 'UNIVERSITY',
        title: 'Universidad',
      },
      {
        dataIndex: 'FOLLOW_UP_DATE',
        key: 'FOLLOW_UP_DATE',
        title: 'Seguimiento',
        render: (value) => formatter({ value, format: 'datetime' }),
      },
      {
        dataIndex: 'NEXT_APPOINTMENT',
        key: 'NEXT_APPOINTMENT',
        title: 'Próxima cita',
        render: (value) =>
          value ? formatter({ value, format: 'datetime' }) : 'No programada',
      },
      {
        dataIndex: 'STATUS',
        key: 'STATUS',
        title: 'Estado',
        render: (value: string) => {
          const option = followUpStatusOptions.find(
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
          label={'Estado del seguimiento'}
          name={['FILTER', 'STATUS__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar estados"
            allowClear
            options={followUpStatusOptions}
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
        rowKey="FOLLOW_UP_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={followUps}
        metadata={metadata}
        createText={'Nuevo seguimiento'}
        searchPlaceholder={'Buscar seguimientos...'}
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
        initialFilter={initialFilter}
      />

      <ConditionalComponent condition={modalOpen}>
        <FollowUpForm
          open={modalOpen}
          followUp={editing}
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

export default FollowUpPage
