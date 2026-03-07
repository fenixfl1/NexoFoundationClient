import { create } from 'zustand'
import { Metadata, ReturnPayload } from 'src/types/general'
import { StudentRequirement } from 'src/services/student-requirements/student-requirement.types'

const defaultMetadata: Metadata = {
  currentPage: 1,
  totalPages: 0,
  totalRows: 0,
  count: 0,
  pageSize: 10,
  links: undefined,
}

interface UseStudentRequirementStore {
  studentRequirements: StudentRequirement[]
  metadata: Metadata
  summary: Record<string, string | number>
  setStudentRequirements: (payload: ReturnPayload<StudentRequirement>) => void
}

export const useStudentRequirementStore = create<UseStudentRequirementStore>(
  (set) => ({
    studentRequirements: [],
    metadata: defaultMetadata,
    summary: {},
    setStudentRequirements: ({ data, metadata }) =>
      set({
        studentRequirements: data,
        metadata: metadata?.pagination ?? defaultMetadata,
        summary: metadata?.summary ?? {},
      }),
  })
)
