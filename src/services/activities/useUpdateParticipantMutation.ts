import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { putRequest } from '../api'
import { API_PATH_ACTIVITY_PARTICIPANT_UPDATE } from 'src/constants/routes'
import { ActivityParticipant, ParticipantStatus } from './activity.types'

interface UpdateParticipantPayload {
  PARTICIPANT_ID: number
  STATUS: ParticipantStatus
  HOURS_EARNED?: number
}

export function useUpdateParticipantMutation(onSuccess?: () => void) {
  return useCustomMutation<ActivityParticipant, UpdateParticipantPayload>({
    mutationKey: ['activities', 'participants', 'update'],
    mutationFn: async (payload) => {
      const { data } = await putRequest<ActivityParticipant>(
        API_PATH_ACTIVITY_PARTICIPANT_UPDATE,
        payload
      )
      return data?.data as ActivityParticipant
    },
    onSuccess,
  })
}
