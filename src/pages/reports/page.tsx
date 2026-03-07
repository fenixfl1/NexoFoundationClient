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
import { CustomText } from 'src/components/custom/CustomParagraph'
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
  ReportCatalogItem,
  ReportFilterDefinition,
} from 'src/services/reports/report.types'
import { useRunReportMutation } from 'src/services/reports/useRunReportMutation'
import { useReportStore } from 'src/store/reports.store'
import { Metadata } from 'src/types/general'
import formatter from 'src/utils/formatter'
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

const renderCellValue = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'

  if (
    typeof value === 'string' &&
    /(DATE|_AT|CREATED_AT|UPDATED_AT|START|END)/.test(key)
  ) {
    try {
      return formatter({
        value,
        format: key.includes('AT') ? 'datetime' : 'date',
      })
    } catch {
      return value
    }
  }

  if (typeof value === 'number' && key.includes('PCT')) {
    return `${value}%`
  }

  if (
    (typeof value === 'number' ||
      (typeof value === 'string' && !isNaN(Number(value)))) &&
    key.includes('AMOUNT')
  ) {
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

  const { catalog, rows, metadata, summary } = useReportStore()
  const { isPending: isCatalogPending } = useGetReportCatalogQuery()
  const { mutate: runReport, isPending: isRunPending } = useRunReportMutation()
  const { mutateAsync: exportReport, isPending: isExportPending } =
    useExportReportMutation()

  const selectedReport = useMemo(
    () => catalog.find((item) => item.KEY === selectedReportKey),
    [catalog, selectedReportKey]
  )

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
        title: humanizeKey(key),
        value: value ?? 0,
      })),
    [summary]
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
    const firstRow = tableRows?.[0]
    if (!firstRow) return []

    return Object.keys(firstRow)
      .filter((key) => key !== '__ROW_KEY')
      .map((key) => ({
        dataIndex: key,
        key,
        title: humanizeKey(key),
        render: (value: unknown) => renderCellValue(key, value),
      }))
  }, [tableRows])

  const columnsMap = useMemo<ColumnsMap<Record<string, unknown>>>(() => {
    return columns.reduce(
      (acc, column) => {
        const dataIndex = Array.isArray(column?.['dataIndex'])
          ? column?.['dataIndex'].join('.')
          : column?.['dataIndex']
        const key = String(dataIndex ?? column.key ?? '').trim()
        if (!key || key === '__ROW_KEY') return acc

        const title =
          typeof column.title === 'string' ? column.title : humanizeKey(key)
        acc[key] = {
          header: title,
          render: (value) => renderCellValue(key, value),
        }
        return acc
      },
      {} as ColumnsMap<Record<string, unknown>>
    )
  }, [columns])

  const renderFilterField = (filter: ReportFilterDefinition) => {
    if (filter.type === 'date') {
      return <CustomDatePicker allowClear />
    }

    if (filter.type === 'select') {
      return (
        <CustomSelect
          mode={filter.multiple ? 'multiple' : undefined}
          allowClear
          options={filter.options ?? []}
          placeholder={filter.label}
        />
      )
    }

    return <CustomInput placeholder={filter.label} />
  }

  return (
    <CustomSpin spinning={isCatalogPending || isRunPending || isExportPending}>
      <CustomCard>
        <CustomForm form={form} layout="vertical">
          <CustomRow gutter={[10, 10]}>
            <CustomCol xs={24} md={8}>
              <CustomFormItem label={'Reporte'}>
                <CustomSelect
                  placeholder={'Seleccionar reporte'}
                  value={selectedReportKey}
                  onChange={(value) => setSelectedReportKey(value)}
                  options={catalog.map((item: ReportCatalogItem) => ({
                    label: item.NAME,
                    value: item.KEY,
                  }))}
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
            <CustomText type="secondary">
              {selectedReport?.DESCRIPTION ||
                'Selecciona un reporte para iniciar.'}
            </CustomText>
          </CustomCol>
          <CustomCol xs={24} md={8}>
            <CustomRow justify={'end'} gap={8}>
              <CustomButton
                type="primary"
                onClick={() => handleRun(1, metadata?.pageSize || 10)}
              >
                Generar
              </CustomButton>
              <CustomButton onClick={handleExport}>Exportar</CustomButton>
            </CustomRow>
          </CustomCol>
        </CustomRow>
      </CustomCard>

      <ConditionalComponent condition={Boolean(summaryData.length)}>
        <>
          <CustomDivider />
          <ModuleSummary
            dataSource={summaryData}
            total={metadata?.totalRows}
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
