import { create } from 'zustand'
import { Metadata, ReturnPayload } from 'src/types/general'
import { RequestItem } from 'src/services/requests/request.types'

interface UseRequestStore {
  requests: RequestItem[]
  metadata: Metadata
  selected?: RequestItem
  drawerOpen: boolean
  summary: Record<string, string | number>
  setRequests: (payload: ReturnPayload<RequestItem>) => void
  openDrawer: (request?: RequestItem) => void
  closeDrawer: () => void
}

const defaultMetadata: Metadata = {
  currentPage: 1,
  totalPages: 0,
  totalRows: 0,
  count: 0,
  pageSize: 10,
  links: undefined,
}

export const useRequestStore = create<UseRequestStore>((set) => ({
  requests: [],
  metadata: defaultMetadata,
  selected: undefined,
  drawerOpen: false,
  summary: {},
  openDrawer: (request) => set({ drawerOpen: true, selected: request }),
  closeDrawer: () => set({ drawerOpen: false, selected: undefined }),
  setRequests: ({ data, metadata }) =>
    set({
      requests: data ?? [],
      metadata: metadata?.pagination ?? defaultMetadata,
      summary: metadata?.summary ?? {},
    }),
}))
