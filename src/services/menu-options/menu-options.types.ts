export interface MenuOption {
  CHILDREN?: MenuOption[]
  CONTENT?: string
  DESCRIPTION?: string
  ICON?: string
  MENU_OPTION_ID: string
  NAME: string
  PARENT_ID?: string
  PATH: string
  TYPE?: 'submenu' | 'item' | 'group' | 'divider'
  ORDER?: number
  STATE?: string
  CREATED_AT?: string
  PERMISSIONS?: {
    PERMISSION_ID: number
    DESCRIPTION: string
    ACTION_ID: number
    ACTION_NAME: string
  }[]
}

export type OptionWithPermission = MenuOption
