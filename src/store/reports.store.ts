import { create } from 'zustand'
import {
  ReportCatalogItem,
  ReportRow,
  ReportRunResponse,
} from 'src/services/reports/report.types'
import { Metadata } from 'src/types/general'

interface ReportsStore {
  catalog: ReportCatalogItem[]
  rows: ReportRow[]
  metadata: Metadata
  summary: Record<string, string | number>
  setCatalog: (catalog: ReportCatalogItem[]) => void
  setReportResult: (payload: ReportRunResponse) => void
}

const defaultMetadata: Metadata = {
  currentPage: 1,
  totalPages: 0,
  totalRows: 0,
  count: 0,
  pageSize: 10,
  links: undefined,
}

export const useReportStore = create<ReportsStore>((set) => ({
  catalog: [],
  rows: [],
  metadata: defaultMetadata,
  summary: {},
  setCatalog: (catalog) => set({ catalog }),
  setReportResult: (payload) =>
    set({
      rows: payload?.data ?? [],
      metadata: payload?.metadata?.pagination ?? defaultMetadata,
      summary: payload?.metadata?.summary ?? {},
    }),
}))

