import { useQuery } from '@tanstack/react-query'
import { getRequest } from '../api'
import { API_PATH_GET_TERM } from 'src/constants/routes'
import { Term } from './grades.types'

export function useGetTermQuery(termId?: number) {
  return useQuery({
    enabled: !!termId,
    queryKey: ['terms', termId],
    queryFn: async () => {
      const { data } = await getRequest<Term>(API_PATH_GET_TERM, termId)
      return data?.data as Term
    },
  })
}
