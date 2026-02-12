import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { putRequest } from '../api'
import { API_PATH_CREATE_UPDATE_MENU_OPTION } from 'src/constants/routes'
import { MenuOption } from './menu-options.types'

export function useUpdateMenuOptionMutation() {
  return useCustomMutation<MenuOption, Partial<MenuOption>>({
    initialData: <MenuOption>{},
    mutationKey: ['menu-options', 'update-update'],
    mutationFn: async (payload) => {
      const {
        data: { data },
      } = await putRequest<MenuOption>(
        API_PATH_CREATE_UPDATE_MENU_OPTION,
        payload
      )

      return data
    },
  })
}
