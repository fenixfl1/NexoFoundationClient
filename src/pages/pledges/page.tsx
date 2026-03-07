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
import ModuleSummary from 'src/components/ModuleSummary'
import { ColumnsType } from 'antd/lib/table'
import { usePledgeStore } from 'src/store/pledge.store'
import { Pledge } from 'src/services/pledges/pledge.types'
import { useGetPledgePaginationMutation } from 'src/services/pledges/useGetPledgePaginationMutation'
import { useUpdatePledgeMutation } from 'src/services/pledges/useUpdatePledgeMutation'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import formatter from 'src/utils/formatter'
import { CustomText } from 'src/components/custom/CustomParagraph'
import PledgeForm from './components/PledgeForm'
import { pledgeStatusOptions, pledgeFrequencyOptions } from './constants'

const pledgeInitialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const PledgesPage: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Pledge>()
  const debounce = useDebounce(searchKey)
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const { pledges, metadata, summary } = usePledgeStore()
  const { mutate: getPledges, isPending } = useGetPledgePaginationMutation()
  const { mutateAsync: updatePledge, isPending: isUpdatePending } =
    useUpdatePledgeMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = pledgeInitialFilter.FILTER } = form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: 'FILTER',
        })
      }

      getPledges({ page, size, condition })
    },
    [debounce, form, metadata.currentPage, metadata.pageSize, getPledges]
  )

  useEffect(handleSearch, [handleSearch])

  const handleToggleState = (record: Pledge) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } el compromiso?`,
      onOk: async () => {
        try {
          await updatePledge({
            PLEDGE_ID: record.PLEDGE_ID,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          } as Pledge)
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<Pledge> = useMemo(
    () => [
      {
        dataIndex: 'SPONSOR_NAME',
        key: 'SPONSOR_NAME',
        title: 'Patrocinador',
      },
      {
        dataIndex: 'NAME',
        key: 'NAME',
        title: 'Compromiso',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{record.NAME}</CustomText>
            <CustomText type="secondary">{record.FREQUENCY ?? ''}</CustomText>
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
          const option = pledgeStatusOptions.find(
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
          label={'Estado del compromiso'}
          name={['FILTER', 'STATUS__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar estados"
            allowClear
            options={pledgeStatusOptions}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Frecuencia'}
          name={['FILTER', 'FREQUENCY__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar frecuencia"
            allowClear
            options={pledgeFrequencyOptions}
          />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  const summaryData = useMemo(
    () =>
      pledgeStatusOptions.map((option) => ({
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
        rowKey="PLEDGE_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={pledges}
        metadata={metadata}
        createText={'Nuevo compromiso'}
        searchPlaceholder={'Buscar compromisos...'}
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
        initialFilter={pledgeInitialFilter}
      />

      <ConditionalComponent condition={modalOpen}>
        <PledgeForm
          open={modalOpen}
          pledge={editing}
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

export default PledgesPage
