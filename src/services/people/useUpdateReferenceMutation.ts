import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { putRequest } from '../api'
import { API_PATH_UPDATE_PERSON_REFERENCE } from 'src/constants/routes'
import { Reference } from './people.types'

type UpdateReferencePayload = Partial<Reference> & {
  REFERENCE_ID: number
}

export function useUpdateReferenceMutation() {
  return useCustomMutation<Reference, UpdateReferencePayload>({
    initialData: {} as Reference,
    mutationKey: ['person', 'update-reference'],
    mutationFn: async (payload) => {
      const {
        data: { data },
      } = await putRequest<Reference>(API_PATH_UPDATE_PERSON_REFERENCE, payload)

      return data
    },
  })
}
