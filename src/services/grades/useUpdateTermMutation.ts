import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { Term, TermPayload } from './grades.types'
import { putRequest } from '../api'
import { API_PATH_CREATE_UPDATE_TERM } from 'src/constants/routes'

export function useUpdateTermMutation(onSuccess?: () => void) {
  return useCustomMutation<Term, TermPayload & { TERM_ID: number }>({
    mutationKey: ['terms', 'update'],
    mutationFn: async (payload) => {
      const { data } = await putRequest<Term>(
        API_PATH_CREATE_UPDATE_TERM,
        payload
      )
      return data?.data as Term
    },
    onSuccess,
  })
}
