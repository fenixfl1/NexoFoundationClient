import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import SmartTable from 'src/components/SmartTable'
import ConditionalComponent from 'src/components/ConditionalComponent'
import { useParameterStore } from 'src/store/parameter.store'
import { useGetParameterPaginationMutation } from 'src/services/parameter/useGetParameterPaginationMutation'
import { Parameter } from 'src/services/parameter/parameter.types'
import { ColumnsType } from 'antd/lib/table'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import StateSelector from 'src/components/StateSelector'
import useDebounce from 'src/hooks/use-debounce'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { useUpdateParameterMutation } from 'src/services/parameter/useUpdateParameterMutation'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import ParameterForm from './components/ParameterForm'

const initialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const ParameterPage: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Parameter>()
  const debounce = useDebounce(searchKey)
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const { parameters, metadata } = useParameterStore()
  const { mutate: getParameters, isPending } =
    useGetParameterPaginationMutation()
  const { mutateAsync: updateParameter, isPending: isUpdatePending } =
    useUpdateParameterMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = initialFilter.FILTER } = form.getFieldsValue()
      const filterCondition = getConditionFromForm(FILTER)
      const condition: AdvancedCondition<Parameter>[] = [...filterCondition]

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: ['PARAMETER', 'DESCRIPTION', 'VALUE', 'MENU_OPTION_NAME'],
        })
      }

      getParameters({ page, size, condition })
    },
    [debounce, form, metadata.currentPage, metadata.pageSize]
  )

  useEffect(handleSearch, [handleSearch])

  const handleToggleState = async (record: Parameter) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } el parámetro "${record.PARAMETER}"?`,
      onOk: async () => {
        try {
          await updateParameter({
            PARAMETER_ID: record.PARAMETER_ID,
            MENU_OPTION_ID: record.MENU_OPTION_ID,
            PARAMETER: record.PARAMETER,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          })
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<Parameter> = useMemo(
    () => [
      {
        dataIndex: 'PARAMETER',
        key: 'PARAMETER',
        title: 'Parámetro',
      },
      {
        dataIndex: 'DESCRIPTION',
        key: 'DESCRIPTION',
        title: 'Descripción',
      },
      {
        dataIndex: 'VALUE',
        key: 'VALUE',
        title: 'Valor',
      },
      {
        dataIndex: 'MENU_OPTION_NAME',
        key: 'MENU_OPTION_NAME',
        title: 'Opción de menú',
      },
    ],
    []
  )

  const filter = (
    <CustomRow>
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
        rowKey="PARAMETER_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={parameters}
        metadata={metadata}
        createText={'Nuevo parámetro'}
        searchPlaceholder={'Buscar parámetros...'}
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
        <ParameterForm
          open={modalOpen}
          parameter={editing}
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

export default ParameterPage
