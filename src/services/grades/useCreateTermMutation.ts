import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { Term, TermPayload } from './grades.types'
import { postRequest } from '../api'
import { API_PATH_CREATE_UPDATE_TERM } from 'src/constants/routes'

export function useCreateTermMutation(onSuccess?: () => void) {
  return useCustomMutation<Term, TermPayload>({
    mutationKey: ['terms', 'create'],
    mutationFn: async (payload) => {
      const { data } = await postRequest<Term>(
        API_PATH_CREATE_UPDATE_TERM,
        payload
      )
      return data?.data as Term
    },
    onSuccess,
  })
}
