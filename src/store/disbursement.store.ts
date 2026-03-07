import { create } from 'zustand'
import { Metadata, ReturnPayload } from 'src/types/general'
import { Disbursement } from 'src/services/disbursements/disbursement.types'

const defaultMetadata: Metadata = {
  currentPage: 1,
  totalPages: 0,
  totalRows: 0,
  count: 0,
  pageSize: 10,
  links: undefined,
}

interface UseDisbursementStore {
  disbursements: Disbursement[]
  metadata: Metadata
  summary: Record<string, string | number>
  setDisbursements: (payload: ReturnPayload<Disbursement>) => void
}

export const useDisbursementStore = create<UseDisbursementStore>((set) => ({
  disbursements: [],
  metadata: defaultMetadata,
  summary: {},
  setDisbursements: ({ data, metadata }) =>
    set({
      disbursements: data,
      metadata: metadata?.pagination ?? defaultMetadata,
      summary: metadata?.summary ?? {},
    }),
}))
