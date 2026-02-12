import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { GetPayload, ReturnPayload } from 'src/types/general'
import { Activity } from './activity.types'
import { getQueryString, postRequest } from '../api'
import { API_PATH_GET_ACTIVITY_PAGINATION } from 'src/constants/routes'
import { useActivitiesStore } from 'src/store/activities.store'

const initialData: ReturnPayload<Activity> = {
  data: [],
  metadata: {
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalRows: 0,
      count: 0,
      pageSize: 10,
      links: undefined,
    },
  },
}

export function useGetActivityPaginationMutation() {
  const { setActivities } = useActivitiesStore()

  return useCustomMutation<ReturnPayload<Activity>, GetPayload<Activity>>({
    initialData,
    mutationKey: ['activities', 'get-pagination'],
    onSuccess: setActivities,
    onError: () => setActivities(initialData),
    mutationFn: async ({ condition, page, size }) => {
      const { data } = await postRequest<Activity[]>(
        getQueryString(API_PATH_GET_ACTIVITY_PAGINATION, { page, size }),
        condition
      )
      return data || initialData
    },
  })
}
