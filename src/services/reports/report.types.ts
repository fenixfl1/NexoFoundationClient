import { Metadata } from 'src/types/general'

export type ReportFilterType = 'text' | 'date' | 'select'

export interface ReportFilterOption {
  label: string
  value: string
}

export interface ReportFilterDefinition {
  key: string
  label: string
  type: ReportFilterType
  multiple?: boolean
  options?: ReportFilterOption[]
}

export interface ReportCatalogItem {
  KEY: string
  NAME: string
  DESCRIPTION: string
  MODULE: string
  FILTERS: ReportFilterDefinition[]
}

export type ReportRow = Record<string, unknown>

export interface ReportRunPayload {
  key: string
  filters?: Record<string, unknown>
  page: number
  size: number
}

export interface ReportExportPayload {
  key: string
  filters?: Record<string, unknown>
  format?: 'csv' | 'xlsx' | 'pdf' | 'json'
}

export interface ReportExportResult {
  report: ReportCatalogItem
  format: string
  rows: ReportRow[]
  summary: Record<string, number>
  generatedAt: string
  fileName: string
}

export interface ReportRunResponse {
  data: ReportRow[]
  metadata: {
    pagination: Metadata
    summary?: Record<string, string | number>
    report?: {
      key: string
      name: string
    }
  }
}

