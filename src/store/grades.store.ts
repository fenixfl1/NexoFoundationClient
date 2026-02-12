import { create } from 'zustand'
import { ReturnPayload } from 'src/types/general'
import { Term } from 'src/services/grades/grades.types'

interface GradeState {
  terms: Term[]
  metadata?: ReturnPayload<Term>['metadata']['pagination']
  setTerms: (payload: ReturnPayload<Term>) => void
}

export const useGradesStore = create<GradeState>((set) => ({
  terms: [],
  metadata: {
    currentPage: 1,
    totalPages: 0,
    totalRows: 0,
    count: 0,
    pageSize: 10,
    links: undefined,
  },
  setTerms: (payload) =>
    set({
      terms: payload.data ?? [],
      metadata: payload.metadata.pagination,
    }),
}))
