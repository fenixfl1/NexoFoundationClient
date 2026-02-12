import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { Activity, ActivityPayload } from './activity.types'
import { postRequest } from '../api'
import { API_PATH_CREATE_UPDATE_ACTIVITY } from 'src/constants/routes'

export function useCreateActivityMutation(onSuccess?: () => void) {
  return useCustomMutation<Activity, ActivityPayload>({
    mutationKey: ['activities', 'create'],
    mutationFn: async (payload) => {
      const { data } = await postRequest<Activity>(
        API_PATH_CREATE_UPDATE_ACTIVITY,
        payload
      )
      return data?.data as Activity
    },
    onSuccess,
  })
}
