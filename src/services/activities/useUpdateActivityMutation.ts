import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { Activity, ActivityPayload } from './activity.types'
import { putRequest } from '../api'
import { API_PATH_CREATE_UPDATE_ACTIVITY } from 'src/constants/routes'

export function useUpdateActivityMutation(onSuccess?: () => void) {
  return useCustomMutation<Activity, ActivityPayload & { ACTIVITY_ID: number }>(
    {
      mutationKey: ['activities', 'update'],
      mutationFn: async (payload) => {
        const { data } = await putRequest<Activity>(
          API_PATH_CREATE_UPDATE_ACTIVITY,
          payload
        )
        return data?.data as Activity
      },
      onSuccess,
    }
  )
}
