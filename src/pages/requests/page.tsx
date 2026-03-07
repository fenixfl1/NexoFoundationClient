import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomSpin from 'src/components/custom/CustomSpin'
import SmartTable from 'src/components/SmartTable'
import CustomTag from 'src/components/custom/CustomTag'
import CustomButton from 'src/components/custom/CustomButton'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomTooltip from 'src/components/custom/CustomTooltip'
import { ColumnsType } from 'antd/lib/table'
import { RequestItem } from 'src/services/requests/request.types'
import { useRequestStore } from 'src/store/requests.store'
import { CustomText, CustomTitle } from 'src/components/custom/CustomParagraph'
import { EyeOutlined, EditOutlined } from '@ant-design/icons'
import RequestDetail from './components/RequestDetail'
import formatter from 'src/utils/formatter'
import { useGetRequestPaginationMutation } from 'src/services/requests/useGetRequestPaginationMutation'
import { AdvancedCondition } from 'src/types/general'
import RequestForm from './components/RequestForm'
import { useGetMultiCatalogList } from 'src/hooks/use-get-multi-catalog-list'
import { useGetCatalog } from 'src/hooks/use-get-catalog'
import ModuleSummary from 'src/components/ModuleSummary'
import useDebounce from 'src/hooks/use-debounce'
import ConditionalComponent from 'src/components/ConditionalComponent'
import { ColumnMapValue } from 'src/components/custom/CustomTable'

const RequestsPage: React.FC = () => {
  const [modalState, setModalState] = useState<boolean>()
  const [editing, setEditing] = useState<RequestItem>()
  const [searchKey, setSearchKey] = useState('')
  const debounce = useDebounce(searchKey)
  const {
    requests,
    summary,
    metadata,
    selected,
    drawerOpen,
    openDrawer,
    closeDrawer,
  } = useRequestStore()
  const { mutate: getRequests, isPending } = useGetRequestPaginationMutation()
  useGetMultiCatalogList()

  const statusConfig = {}

  const [status] = useGetCatalog('ID_LIST_REQUEST_STATUS')
  const [requestTypes] = useGetCatalog('ID_LIST_REQUEST_TYPES')
  const [careesList] = useGetCatalog('ID_LIST_CAREERS')

  const loadRequests = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const condition: AdvancedCondition[] = []

      if (debounce) {
        condition.push({
          field: 'FILTER',
          operator: 'LIKE',
          value: debounce,
        })
      }

      getRequests({ page, size, condition })
    },
    [getRequests, debounce]
  )

  useEffect(loadRequests, [loadRequests])

  const statusSummary = useMemo(() => {
    const summaryMap = status.reduce<
      Record<
        string,
        {
          key: string
          title: string
          value: number | string
        }
      >
    >((acc, item) => {
      acc[item.VALUE] = {
        key: item.VALUE,
        title: item.LABEL ?? item.VALUE,
        value: summary[item.VALUE],
      }

      return acc
    }, {})

    return Object.values(summaryMap)
  }, [summary, status])

  const toggleModalState = () => setModalState(!modalState)

  const columns: ColumnsType<RequestItem> = [
    {
      dataIndex: 'STUDENT_NAME',
      key: 'student',
      title: 'Becario',
      render: (_, record) => (
        <CustomSpace direction="vertical" size={0}>
          <CustomText strong>
            {record.NAME} {record.LAST_NAME}
          </CustomText>
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
      dataIndex: 'UNIVERSITY',
      key: 'UNIVERSITY',
      title: 'Institución',
      render: (_, record) => (
        <CustomSpace direction="vertical" size={0}>
          <span>{record.UNIVERSITY}</span>
          <CustomText type="secondary">{record.CAREER}</CustomText>
        </CustomSpace>
      ),
    },
    {
      dataIndex: 'REQUEST_TYPE',
      key: 'type',
      title: 'Tipo',
      render: (value) => {
        const item = requestTypes.find((item) => item.VALUE === value)

        return (
          <CustomTooltip title={item?.EXTRA?.description}>
            <CustomTag color={item?.EXTRA?.color}>
              {item?.LABEL ?? value}
            </CustomTag>
          </CustomTooltip>
        )
      },
    },
    {
      dataIndex: 'NEXT_APPOINTMENT',
      key: 'NEXT_APPOINTMENT',
      title: 'Cita programada',
      render: (value) =>
        value ? formatter({ value, format: 'date' }) : 'No programada',
    },
    {
      dataIndex: 'STATUS',
      key: 'status',
      title: 'Estado',
      render: (value) => {
        const item = status.find((item) => item.VALUE === value)

        return (
          <CustomTooltip title={item?.EXTRA?.description}>
            <CustomTag color={item?.EXTRA?.color}>
              {item?.LABEL ?? value}
            </CustomTag>
          </CustomTooltip>
        )
      },
    },
    {
      dataIndex: 'actions',
      key: 'actions',
      title: 'Acciones',
      align: 'center',
      render: (_, record) => (
        <CustomSpace direction={'horizontal'}>
          <CustomTooltip title="Ver detalle">
            <CustomButton
              type="link"
              icon={<EyeOutlined />}
              onClick={() => openDrawer(record)}
            />
          </CustomTooltip>
          <CustomTooltip title="Editar solicitud">
            <CustomButton
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(record)
                setModalState(true)
              }}
            />
          </CustomTooltip>
        </CustomSpace>
      ),
    },
  ]

  const columnsMap: Partial<
    Record<keyof RequestItem, ColumnMapValue<RequestItem>>
  > = {
    NAME: {
      header: 'Becario',
      render: (_, record) => `${record.NAME} ${record.LAST_NAME}`,
    },
    IDENTITY_DOCUMENT: {
      header: 'Doc. Identidad',
      render: (value: string) => formatter({ value, format: 'document' }),
    },
    UNIVERSITY: 'Universidad',
    CAREER: {
      header: 'Carrera',
      render: (value: string) => {
        const item = careesList?.find((item) => item.VALUE === value)
        if (item?.VALUE) {
          return `${item?.LABEL} (${item.VALUE})`
        }

        return 'Por definir'
      },
    },
    REQUEST_TYPE: {
      header: 'Tipo Solicitud',
      render: (value: string) => {
        const item = requestTypes?.find((item) => item.VALUE === value)
        if (item?.VALUE) {
          return item.LABEL
        }
        return 'N/A'
      },
    },
    NEXT_APPOINTMENT: {
      header: 'Cita Programada',
      render: (value: string) =>
        value ? formatter({ value, format: 'date' }) : 'No programada',
    },
  }

  return (
    <>
      <CustomSpin spinning={isPending}>
        <ModuleSummary
          total={metadata.totalRows}
          dataSource={statusSummary}
          title={
            <CustomDivider>
              <CustomTitle level={5}>Resumen de solicitudes </CustomTitle>
            </CustomDivider>
          }
        />
        <CustomDivider />

        <SmartTable
          exportable
          columnsMap={columnsMap}
          showStates={false}
          dataSource={requests}
          columns={columns}
          metadata={metadata}
          createText={'Nueva solicitud'}
          showActions={false}
          onCreate={() => {
            setEditing(undefined)
            toggleModalState()
          }}
          onEdit={() => null}
          onUpdate={() => null}
          onSearch={setSearchKey}
          onChange={loadRequests}
        />
      </CustomSpin>

      <ConditionalComponent condition={drawerOpen}>
        <RequestDetail
          open={drawerOpen}
          request={selected}
          onClose={closeDrawer}
          statusColors={statusConfig}
        />
      </ConditionalComponent>

      <ConditionalComponent condition={modalState}>
        <RequestForm
          open={modalState}
          request={editing}
          onCancel={() => {
            setEditing(undefined)
            toggleModalState()
          }}
          onSuccess={loadRequests}
        />
      </ConditionalComponent>
    </>
  )
}

export default RequestsPage
