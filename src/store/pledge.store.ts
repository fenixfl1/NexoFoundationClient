import { create } from 'zustand'
import { Metadata, ReturnPayload } from 'src/types/general'
import { Pledge } from 'src/services/pledges/pledge.types'

const defaultMetadata: Metadata = {
  currentPage: 1,
  totalPages: 0,
  totalRows: 0,
  count: 0,
  pageSize: 10,
  links: undefined,
}

interface UsePledgeStore {
  pledges: Pledge[]
  metadata: Metadata
  summary: Record<string, string | number>
  setPledges: (payload: ReturnPayload<Pledge>) => void
}

export const usePledgeStore = create<UsePledgeStore>((set) => ({
  pledges: [],
  metadata: defaultMetadata,
  summary: {},
  setPledges: ({ data, metadata }) =>
    set({
      pledges: data,
      metadata: metadata?.pagination ?? defaultMetadata,
      summary: metadata?.summary ?? {},
    }),
}))
