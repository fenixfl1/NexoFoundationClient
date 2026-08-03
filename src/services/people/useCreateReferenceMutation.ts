import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { Reference } from './people.types'
import { postRequest } from '../api'
import { API_PATH_CREATE_PERSON_REFERENCES } from 'src/constants/routes'

export function useCreateReferenceMutation() {
  return useCustomMutation<Reference[], Reference>({
    initialData: [],
    mutationKey: ['person', 'create-reference'],
    mutationFn: async (payload) => {
      const {
        data: { data },
      } = await postRequest<Reference[]>(
        API_PATH_CREATE_PERSON_REFERENCES,
        payload
      )

      return data
    },
  })
}
