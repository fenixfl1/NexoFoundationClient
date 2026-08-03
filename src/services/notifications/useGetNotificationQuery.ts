import { useQuery } from '@tanstack/react-query'
import { getRequest } from '../api'
import { NotificationItem } from './notification.types'
import { API_PATH_GET_NOTIFICATION } from 'src/constants/routes'

export function useGetNotificationQuery(
  notificationId?: number,
  enabled = true
) {
  return useQuery({
    queryKey: ['notifications', 'get-one', notificationId],
    enabled: Boolean(notificationId && enabled),
    refetchOnMount: 'always',
    queryFn: async () => {
      const {
        data: { data },
      } = await getRequest<NotificationItem>(
        API_PATH_GET_NOTIFICATION,
        notificationId
      )

      return data
    },
  })
}
