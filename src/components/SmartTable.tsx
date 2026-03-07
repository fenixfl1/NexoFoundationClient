/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnsType } from 'antd/lib/table'
import React, { useMemo } from 'react'
import { Metadata } from 'src/types/general'
import CustomSpace from './custom/CustomSpace'
import CustomTooltip from './custom/CustomTooltip'
import CustomButton from './custom/CustomButton'
import {
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
import CustomTable, { ColumnsMap } from './custom/CustomTable'
import { ExportFormValue } from './ExportOptions'
import { getTablePagination } from 'src/utils/table-pagination'
import CustomCard from './custom/CustomCard'
import CustomCol from './custom/CustomCol'
import CustomRow from './custom/CustomRow'
import CustomSearch from './custom/CustomSearch'
import { FormInstance, TableProps } from 'antd'
import ConditionalComponent from './ConditionalComponent'
import CustomSpin from './custom/CustomSpin'
import CustomPopover from './custom/CustomPopover'
import FilterTemplate from './FilterTemplate'
import CustomDivider from './custom/CustomDivider'
import { useAppContext } from 'src/context/AppContext'

interface SmartTableProps {
  bordered?: boolean
  columns?: ColumnsType<any>
  columnsMap?: ColumnsMap
  createText?: string
  dataSource?: unknown[]
  expandable?: TableProps['expandable']
  exportable?: boolean
  filter?: React.ReactNode
  form?: FormInstance
  initialFilter?: Record<string, unknown>
  loading?: boolean
  metadata?: Metadata
  onChange?: (current?: number, size?: number) => void
  onCreate?: () => void
  onEdit?: (record: any) => void
  onSearch?: (value: string) => void
  onUpdate?: (record: any) => void
  rowKey?: string
  searchPlaceholder?: string
  showActions?: boolean
  showStates?: boolean
  exportInitialValues?: Partial<ExportFormValue>
  header?: React.ReactNode
  extra?: (value: unknown, record: unknown) => React.ReactNode
}

const SmartTable: React.FC<SmartTableProps> = ({
  bordered = false,
  columns: _columns,
  columnsMap,
  createText = 'Crear',
  dataSource,
  expandable,
  exportable = false,
  exportInitialValues,
  extra,
  filter,
  form,
  header,
  initialFilter,
  loading,
  metadata,
  onChange,
  onCreate,
  onEdit,
  onSearch,
  onUpdate,
  rowKey,
  searchPlaceholder = 'Buscar...',
  showActions = true,
  showStates = true,
}) => {
  const { theme } = useAppContext()

  const actions: ColumnsType<unknown> = [
    {
      width: '5%',
      dataIndex: 'STATE',
      key: 'ACTIONS',
      title: 'Acciones',
      align: 'center',
      render: (state: string, record) => (
        <CustomSpace
          direction={'horizontal'}
          split={<CustomDivider type={'vertical'} size={'small'} />}
        >
          {extra?.(state, record)}
          <CustomTooltip title={'Editar'}>
            <CustomButton
              disabled={state === 'I'}
              onClick={() => onEdit?.(record)}
              type={'link'}
              icon={<EditOutlined />}
            />
          </CustomTooltip>
          <CustomTooltip title={state === 'A' ? 'Inhabilitar' : 'Habilitar'}>
            <CustomButton
              danger={state === 'A'}
              onClick={() => onUpdate?.(record)}
              type={'link'}
              icon={state === 'A' ? <DeleteOutlined /> : <StopOutlined />}
            />
          </CustomTooltip>
        </CustomSpace>
      ),
    },
  ]

  const content = (
    <FilterTemplate
      onSearch={() => onSearch?.('')}
      onFilter={() => onChange()}
      form={form}
      initialValue={initialFilter}
    >
      {filter}
    </FilterTemplate>
  )

  const columns = useMemo(() => {
    const stateColumn = {
      dataIndex: 'STATE',
      key: 'STATE',
      title: 'Estado',
      width: '6%',
      align: 'center' as never,
      render: (state: string) => (state === 'A' ? 'Activo' : 'Inactivo'),
    }

    const arr = [..._columns]

    if (showStates && !arr.some((col) => col.key === 'STATE')) {
      arr.push(stateColumn)
    }

    if (showActions && !_columns.some((col) => col.key === 'ACTIONS')) {
      return Array.from(new Set([...arr, ...actions]))
    }

    return arr
  }, [_columns, showActions])

  const resolvedColumnsMap = useMemo<ColumnsMap | undefined>(() => {
    if (columnsMap && Object.keys(columnsMap).length) {
      return columnsMap
    }

    if (!exportable || !_columns?.length) {
      return undefined
    }

    const autoMap: ColumnsMap = {}
    const normalizeToken = (value: unknown) =>
      String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')

    const isActionColumn = (column: any) => {
      const key = normalizeToken(column?.key)
      const dataIndex = normalizeToken(
        Array.isArray(column?.dataIndex)
          ? column.dataIndex.join('.')
          : column?.dataIndex
      )
      const title =
        typeof column?.title === 'string'
          ? normalizeToken(column.title)
          : normalizeToken('')

      return (
        ['action', 'actions', 'accion', 'acciones'].includes(key) ||
        ['action', 'actions', 'accion', 'acciones'].includes(dataIndex) ||
        ['action', 'actions', 'accion', 'acciones'].includes(title)
      )
    }

    const hasStateLikeColumn = _columns.some((column: any) => {
      const key = normalizeToken(column?.key)
      const dataIndex = normalizeToken(
        Array.isArray(column?.dataIndex)
          ? column.dataIndex.join('.')
          : column?.dataIndex
      )
      const title =
        typeof column?.title === 'string'
          ? normalizeToken(column.title)
          : normalizeToken('')

      return key === 'state' || dataIndex === 'state' || title === 'estado'
    })

    const addColumn = (column: any) => {
      if (!column) return

      if (Array.isArray(column.children) && column.children.length) {
        column.children.forEach(addColumn)
        return
      }

      if (isActionColumn(column)) return

      const dataIndex = Array.isArray(column.dataIndex)
        ? column.dataIndex.join('.')
        : column.dataIndex

      const key = String(dataIndex ?? column.key ?? '').trim()
      if (!key || key === 'ACTIONS') return

      const title =
        typeof column.title === 'string' && column.title.trim()
          ? column.title.trim()
          : key.replace(/_/g, ' ')

      autoMap[key] = title
    }

    _columns.forEach(addColumn)

    if (showStates && !autoMap['STATE'] && !hasStateLikeColumn) {
      autoMap['STATE'] = {
        header: 'Estado',
        render: (value: unknown) => (value === 'A' ? 'Activo' : 'Inactivo'),
      }
    }

    return Object.keys(autoMap).length ? autoMap : undefined
  }, [columnsMap, exportable, _columns, showStates])

  return (
    <>
      <CustomSpin spinning={loading}>
        <CustomCard>
          <CustomSpace size={'large'}>
            <CustomCol xs={24}>
              <CustomRow justify={'space-between'}>
                <ConditionalComponent
                  condition={!!filter}
                  fallback={<CustomCol xs={2} />}
                >
                  <CustomTooltip title={'Filtros'} placement={'left'}>
                    <CustomPopover
                      content={content}
                      title={'Filtros'}
                      trigger={'click'}
                    >
                      <CustomButton
                        size={'large'}
                        type={'text'}
                        icon={<FilterOutlined />}
                      />
                    </CustomPopover>
                  </CustomTooltip>
                </ConditionalComponent>
                <ConditionalComponent
                  condition={!!header}
                  fallback={
                    <CustomCol xs={14}>
                      <CustomRow justify={'end'} gap={5} wrap={false}>
                        <CustomSearch
                          width={'80%'}
                          placeholder={searchPlaceholder}
                          onChange={(e) => onSearch?.(e.target.value)}
                        />
                        <ConditionalComponent condition={!!onCreate}>
                          <CustomButton
                            icon={<PlusOutlined />}
                            type={'primary'}
                            onClick={onCreate}
                          >
                            {createText}
                          </CustomButton>
                        </ConditionalComponent>
                      </CustomRow>
                    </CustomCol>
                  }
                >
                  <>{header}</>
                </ConditionalComponent>
              </CustomRow>
            </CustomCol>

            <CustomTable
              rowKey={(record) => record[rowKey]}
              columns={columns}
              dataSource={dataSource}
              expandable={expandable}
              onChange={onChange}
              pagination={{
                ...getTablePagination(metadata),
                showSizeChanger: true,
              }}
              columnsMap={resolvedColumnsMap}
              exportable={exportable}
              bordered={bordered}
              exportInitialValues={exportInitialValues}
              rowClassName={(record) =>
                record.STATE === 'I'
                  ? `custom-table-row-disabled-${theme}`
                  : undefined
              }
            />
          </CustomSpace>
        </CustomCard>
      </CustomSpin>
    </>
  )
}

export default SmartTable
