import { create } from 'zustand'
import { ReturnPayload } from 'src/types/general'
import { Activity } from 'src/services/activities/activity.types'

interface ActivitiesState {
  activities: Activity[]
  metadata?: ReturnPayload<Activity>['metadata']['pagination']
  setActivities: (payload: ReturnPayload<Activity>) => void
}

export const useActivitiesStore = create<ActivitiesState>((set) => ({
  activities: [],
  metadata: {
    currentPage: 1,
    totalPages: 0,
    totalRows: 0,
    count: 0,
    pageSize: 10,
    links: undefined,
  },
  setActivities: (payload) =>
    set({
      activities: payload.data ?? [],
      metadata: payload.metadata.pagination,
    }),
}))
