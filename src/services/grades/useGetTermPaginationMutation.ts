import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { GetPayload, ReturnPayload } from 'src/types/general'
import { Term } from './grades.types'
import { getQueryString, postRequest } from '../api'
import { API_PATH_GET_TERM_PAGINATION } from 'src/constants/routes'
import { useGradesStore } from 'src/store/grades.store'

const initialData: ReturnPayload<Term> = {
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

export function useGetTermPaginationMutation() {
  const { setTerms } = useGradesStore()

  return useCustomMutation<ReturnPayload<Term>, GetPayload<Term>>({
    initialData,
    mutationKey: ['terms', 'get-pagination'],
    onSuccess: setTerms,
    onError: () => setTerms(initialData),
    mutationFn: async ({ condition, page, size }) => {
      const { data } = await postRequest<Term[]>(
        getQueryString(API_PATH_GET_TERM_PAGINATION, { page, size }),
        condition
      )
      return data || initialData
    },
  })
}
