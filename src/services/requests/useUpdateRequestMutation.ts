import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { putRequest } from '../api'
import { API_PATH_CREATE_UPDATE_REQUEST } from 'src/constants/routes'
import { RequestRecord } from 'src/services/requests/request.types'

export interface UpdateRequestPayload extends Partial<RequestRecord> {
  REQUEST_ID: number
}

export function useUpdateRequestMutation() {
  return useCustomMutation<RequestRecord, UpdateRequestPayload>({
    initialData: <RequestRecord>{},
    mutationKey: ['requests', 'update-request'],
    mutationFn: async (payload) => {
      const {
        data: { data },
      } = await putRequest<RequestRecord>(API_PATH_CREATE_UPDATE_REQUEST, payload)

      return data
    },
  })
}
