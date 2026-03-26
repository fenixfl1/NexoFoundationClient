import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { getQueryString, postRequest } from '../api'
import { GetPayload, ReturnPayload } from 'src/types/general'
import { usePeopleStore } from 'src/store/people.store'
import { API_PATH_GET_PEOPLE_PAGINATION } from 'src/constants/routes'
import { Person } from './people.types'

const initialData = {
  data: [],
  metadata: {
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalRows: 0,
      count: 0,
      pageSize: 15,
      links: undefined,
    },
  },
}

export function useGetPaginatedPeopleMutation() {
  const { setPeople } = usePeopleStore()

  return useCustomMutation<ReturnPayload<Person>, GetPayload<Person>>({
    initialData,
    mutationKey: ['people', 'get-pagination'],
    onSuccess: setPeople,
    onError: () => setPeople(initialData),
    mutationFn: async ({ condition, page, size }) => {
      const { data } = await postRequest<Person[]>(
        getQueryString(API_PATH_GET_PEOPLE_PAGINATION, { page, size }),
        condition
      )

      return data || initialData
    },
  })
}
