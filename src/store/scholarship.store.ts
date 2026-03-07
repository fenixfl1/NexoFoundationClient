import { create } from 'zustand'
import { Metadata, ReturnPayload } from 'src/types/general'
import { Scholarship } from 'src/services/scholarships/scholarship.types'

const defaultMetadata: Metadata = {
  currentPage: 1,
  totalPages: 0,
  totalRows: 0,
  count: 0,
  pageSize: 10,
  links: undefined,
}

interface UseScholarshipStore {
  scholarships: Scholarship[]
  metadata: Metadata
  summary: Record<string, string | number>
  setScholarships: (payload: ReturnPayload<Scholarship>) => void
}

export const useScholarshipStore = create<UseScholarshipStore>((set) => ({
  scholarships: [],
  metadata: defaultMetadata,
  summary: {},
  setScholarships: ({ data, metadata }) =>
    set({
      scholarships: data,
      metadata: metadata?.pagination ?? defaultMetadata,
      summary: metadata?.summary ?? {},
    }),
}))
