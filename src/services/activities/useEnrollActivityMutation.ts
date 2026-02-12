import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { postRequest } from '../api'
import { API_PATH_ACTIVITY_ENROLL } from 'src/constants/routes'
import { ActivityParticipant } from './activity.types'

interface EnrollPayload {
  ACTIVITY_ID: number
  STUDENT_ID: number
}

export function useEnrollActivityMutation(onSuccess?: () => void) {
  return useCustomMutation<ActivityParticipant, EnrollPayload>({
    mutationKey: ['activities', 'enroll'],
    mutationFn: async (payload) => {
      const { data } = await postRequest<ActivityParticipant>(
        API_PATH_ACTIVITY_ENROLL,
        payload
      )
      return data?.data as ActivityParticipant
    },
    onSuccess,
  })
}
