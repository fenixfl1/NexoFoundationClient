import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Form } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { ColumnsType } from 'antd/lib/table'
import ConditionalComponent from 'src/components/ConditionalComponent'
import ExportOptions, { ExportFormValue } from 'src/components/ExportOptions'
import ModuleSummary from 'src/components/ModuleSummary'
import CustomButton from 'src/components/custom/CustomButton'
import CustomCard from 'src/components/custom/CustomCard'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDatePicker from 'src/components/custom/CustomDatePicker'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import { CustomText, CustomTitle } from 'src/components/custom/CustomParagraph'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTable, { ColumnsMap } from 'src/components/custom/CustomTable'
import { useCustomNotifications } from 'src/hooks/use-custom-notification'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useExportReportMutation } from 'src/services/reports/useExportReportMutation'
import { useGetReportCatalogQuery } from 'src/services/reports/useGetReportCatalogQuery'
import {
  ReportColumnDefinition,
  ReportFilterDefinition,
} from 'src/services/reports/report.types'
import { useRunReportMutation } from 'src/services/reports/useRunReportMutation'
import { useGetMultiCatalogList } from 'src/hooks/use-get-multi-catalog-list'
import { useCatalogStore } from 'src/store/catalog.store'
import { useReportStore } from 'src/store/reports.store'
import { Metadata } from 'src/types/general'
import formatter from 'src/utils/formatter'
import { getSessionInfo } from 'src/lib/session'
import { ROLE_STUDENT_ID } from 'src/utils/role-path'
import { getTablePagination } from 'src/utils/table-pagination'

const defaultMetadata: Metadata = {
  currentPage: 1,
  totalPages: 0,
  totalRows: 0,
  count: 0,
  pageSize: 10,
  links: undefined,
}

const humanizeKey = (value: string) => {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const normalizeFilterValue = (value: unknown) => {
  if (Array.isArray(value)) {
    const arr = value
      .map((item) => String(item ?? '').trim())
      .filter((item) => Boolean(item))

    return arr.length ? arr : undefined
  }

  if (dayjs.isDayjs(value)) {
    return (value as Dayjs).format('YYYY-MM-DD')
  }

  if (typeof value === 'string') {
    const text = value.trim()
    return text || undefined
  }

  return value ?? undefined
}

type CatalogMaps = Record<string, Record<string, string>>

const renderCellValue = (
  column: Pick<ReportColumnDefinition, 'key' | 'format' | 'catalog'>,
  value: unknown,
  catalogMaps: CatalogMaps = {}
) => {
  if (value === null || value === undefined || value === '') return '—'

  const catalogLabel = column.catalog
    ? catalogMaps[column.catalog]?.[String(value)]
    : undefined

  if (catalogLabel) {
    return catalogLabel
  }

  if (column.format === 'date' || column.format === 'datetime') {
    try {
      return formatter({
        value: value as string,
        format: column.format,
      })
    } catch {
      return String(value)
    }
  }

  if (column.format === 'document') {
    return formatter({ value: value as string, format: 'document' })
  }

  if (column.format === 'percentage') {
    return `${value}%`
  }

  if (column.format === 'currency') {
    return formatter({
      value: Number(value),
      format: 'currency',
      prefix: 'RD',
    })
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

const ReportsPage: React.FC = () => {
  const [form] = Form.useForm()
  const tableRef = useRef(null)
  const [selectedReportKey, setSelectedReportKey] = useState<string>()
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportData, setExportData] = useState<Record<string, unknown>[]>([])
  const [exportInitialValues, setExportInitialValues] =
    useState<Partial<ExportFormValue>>()
  const { warningNotification } = useCustomNotifications()
  const [errorHandler] = useErrorHandler()
  const { roleId } = getSessionInfo()
  const isStudentRole = String(roleId) === ROLE_STUDENT_ID

  useGetMultiCatalogList()
  const { multiCatalogList } = useCatalogStore()
  const { catalog, rows, metadata, summary } = useReportStore()
  const { isPending: isCatalogPending } = useGetReportCatalogQuery()
  const { mutate: runReport, isPending: isRunPending } = useRunReportMutation()
  const { mutateAsync: exportReport, isPending: isExportPending } =
    useExportReportMutation()

  const selectedReport = useMemo(
    () => catalog.find((item) => item.KEY === selectedReportKey),
    [catalog, selectedReportKey]
  )

  const reportOptions = useMemo(() => {
    const grouped = catalog.reduce<
      Record<string, { label: string; value: string }[]>
    >((acc, item) => {
      const module = item.MODULE || 'General'
      acc[module] = acc[module] ?? []
      acc[module].push({ label: item.NAME, value: item.KEY })
      return acc
    }, {})

    return Object.entries(grouped).map(([label, options]) => ({
      label,
      options,
    }))
  }, [catalog])

  const catalogMaps = useMemo<CatalogMaps>(() => {
    return Object.entries(multiCatalogList ?? {}).reduce<CatalogMaps>(
      (acc, [key, items]) => {
        acc[key] = items.reduce<Record<string, string>>((map, item) => {
          map[item.VALUE] = item.LABEL ?? item.VALUE
          return map
        }, {})
        return acc
      },
      {}
    )
  }, [multiCatalogList])

  useEffect(() => {
    if (!catalog.length || selectedReportKey) return
    setSelectedReportKey(catalog[0].KEY)
  }, [catalog, selectedReportKey])

  useEffect(() => {
    if (!selectedReportKey) return
    form.resetFields()
    runReport({
      key: selectedReportKey,
      filters: {},
      page: 1,
      size: metadata?.pageSize ?? defaultMetadata.pageSize,
    })
  }, [form, metadata?.pageSize, runReport, selectedReportKey])

  const filters = useMemo(() => selectedReport?.FILTERS ?? [], [selectedReport])

  const normalizeFilters = useCallback(() => {
    const values = form.getFieldsValue() as Record<string, unknown>

    return Object.entries(values).reduce(
      (acc, [key, value]) => {
        const normalized = normalizeFilterValue(value)
        if (normalized !== undefined) {
          acc[key] = normalized
        }
        return acc
      },
      {} as Record<string, unknown>
    )
  }, [form])

  const handleRun = useCallback(
    (page = metadata?.currentPage || 1, size = metadata?.pageSize || 10) => {
      if (!selectedReportKey) return

      runReport({
        key: selectedReportKey,
        filters: normalizeFilters(),
        page,
        size,
      })
    },
    [
      metadata?.currentPage,
      metadata?.pageSize,
      normalizeFilters,
      runReport,
      selectedReportKey,
    ]
  )

  const handleExport = async () => {
    if (!selectedReportKey) return

    try {
      const result = await exportReport({
        key: selectedReportKey,
        filters: normalizeFilters(),
        format: 'json',
      })

      if (!result?.rows?.length) {
        warningNotification({
          message: 'Sin datos',
          description: 'No hay datos para exportar con los filtros actuales.',
        })
        return
      }

      setExportData(result.rows as Record<string, unknown>[])
      setExportInitialValues({
        format: 'xlsx',
        title: result.report?.NAME || 'Reporte',
        filename: `${result.fileName || selectedReportKey.toLowerCase()}.xlsx`,
      })
      setExportModalOpen(true)
    } catch (error) {
      errorHandler(error)
    }
  }

  const summaryData = useMemo(
    () =>
      Object.entries(summary || {}).map(([key, value]) => ({
        key,
        title:
          selectedReport?.SUMMARY_LABELS?.[key] ??
          (key === 'TOTAL' ? 'Total' : humanizeKey(key)),
        value: value ?? 0,
      })),
    [selectedReport?.SUMMARY_LABELS, summary]
  )

  const tableRows = useMemo(
    () =>
      (rows ?? []).map((row, index) => ({
        __ROW_KEY: `${metadata?.currentPage ?? 1}-${index + 1}`,
        ...row,
      })),
    [metadata?.currentPage, rows]
  )

  const columns: ColumnsType<Record<string, unknown>> = useMemo(() => {
    const reportColumns: ReportColumnDefinition[] = selectedReport?.COLUMNS
      ?.length
      ? selectedReport.COLUMNS
      : Object.keys(tableRows?.[0] ?? {})
          .filter((key) => !['__ROW_KEY', 'FILTER'].includes(key))
          .map((key) => ({ key, label: humanizeKey(key) }))

    return reportColumns
      .filter((column) => !column.hidden)
      .map((column) => ({
        dataIndex: column.key,
        key: column.key,
        title: column.label,
        render: (value: unknown) => renderCellValue(column, value, catalogMaps),
      }))
  }, [catalogMaps, selectedReport?.COLUMNS, tableRows])

  const columnsMap = useMemo<ColumnsMap<Record<string, unknown>>>(() => {
    return columns.reduce(
      (acc, column) => {
        const dataIndex = Array.isArray(column?.['dataIndex'])
          ? column?.['dataIndex'].join('.')
          : column?.['dataIndex']
        const key = String(dataIndex ?? column.key ?? '').trim()
        if (!key || ['__ROW_KEY', 'FILTER'].includes(key)) return acc

        const title =
          typeof column.title === 'string' ? column.title : humanizeKey(key)
        acc[key] = {
          header: title,
          render: (value) => {
            const column = selectedReport?.COLUMNS?.find(
              (item) => item.key === key
            )
            return renderCellValue(column ?? { key }, value, catalogMaps)
          },
        }
        return acc
      },
      {} as ColumnsMap<Record<string, unknown>>
    )
  }, [catalogMaps, columns, selectedReport?.COLUMNS])

  const renderFilterField = (filter: ReportFilterDefinition) => {
    if (filter.type === 'date') {
      return <CustomDatePicker allowClear />
    }

    if (filter.type === 'select') {
      const catalogOptions = filter.catalog
        ? (multiCatalogList?.[filter.catalog] ?? []).map((item) => ({
            label: item.LABEL,
            value: item.VALUE,
          }))
        : undefined

      return (
        <CustomSelect
          mode={filter.multiple ? 'multiple' : undefined}
          allowClear
          options={
            catalogOptions?.length ? catalogOptions : (filter.options ?? [])
          }
          placeholder={filter.label}
        />
      )
    }

    return <CustomInput placeholder={filter.label} />
  }

  return (
    <CustomSpin spinning={isCatalogPending || isRunPending || isExportPending}>
      <CustomCard>
        <CustomForm form={form} layout={'vertical'}>
          <CustomRow justify={'start'} gutter={[10, 10]}>
            <CustomCol xs={24} md={8}>
              <CustomFormItem label={'Reporte'}>
                <CustomSelect
                  placeholder={'Seleccionar reporte'}
                  value={selectedReportKey}
                  onChange={(value) => setSelectedReportKey(value)}
                  options={reportOptions}
                />
              </CustomFormItem>
            </CustomCol>

            {filters.map((filter) => (
              <CustomCol key={filter.key} xs={24} md={8}>
                <CustomFormItem label={filter.label} name={filter.key}>
                  {renderFilterField(filter)}
                </CustomFormItem>
              </CustomCol>
            ))}
          </CustomRow>
        </CustomForm>

        <CustomRow justify={'space-between'} align={'middle'}>
          <CustomCol xs={24} md={16}>
            <CustomSpace direction="vertical" size={0}>
              <CustomTitle level={4}>
                {selectedReport?.NAME ?? 'Reportes'}
              </CustomTitle>
              <CustomText type="secondary">
                {selectedReport?.MODULE ? `${selectedReport.MODULE} · ` : ''}
                {selectedReport?.DESCRIPTION ||
                  'Selecciona un reporte para iniciar.'}
              </CustomText>
            </CustomSpace>
          </CustomCol>
          <CustomCol xs={24} md={8}>
            <CustomRow justify={'end'} gap={8}>
              <CustomButton
                type="primary"
                onClick={() => handleRun(1, metadata?.pageSize || 10)}
              >
                Generar
              </CustomButton>
              <ConditionalComponent condition={!isStudentRole}>
                <CustomButton onClick={handleExport}>Exportar</CustomButton>
              </ConditionalComponent>
            </CustomRow>
          </CustomCol>
        </CustomRow>
      </CustomCard>

      <ConditionalComponent condition={Boolean(summaryData.length)}>
        <>
          <CustomDivider />
          <ModuleSummary
            dataSource={summaryData}
            title={<CustomDivider>Resumen</CustomDivider>}
          />
        </>
      </ConditionalComponent>

      <CustomDivider />

      <CustomCard>
        <CustomSpace>
          <CustomTable
            rowKey={'__ROW_KEY'}
            columns={columns}
            dataSource={tableRows}
            pagination={{
              ...getTablePagination(metadata),
              showSizeChanger: true,
            }}
            onChange={handleRun}
          />
        </CustomSpace>
      </CustomCard>

      <ConditionalComponent condition={exportModalOpen}>
        <ExportOptions
          ref={tableRef}
          open={exportModalOpen}
          onCancel={() => setExportModalOpen(false)}
          dataSource={exportData}
          columnsMap={columnsMap}
          initialValues={exportInitialValues}
        />
      </ConditionalComponent>
    </CustomSpin>
  )
}

export default ReportsPage
