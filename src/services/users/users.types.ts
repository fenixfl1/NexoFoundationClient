export interface User {
  USER_ID: number
  PERSON_ID?: number
  ROLE_ID?: number
  AVATAR: string
  USERNAME: string
  STATE: string
  PASSWORD?: string
  ROLES: string
  FULL_NAME: string
}

export interface Business {
  BUSINESS_ID: number
  NAME: string
  LOGO?: string
  LOGO_URL?: string
  RNC: string
  PHONE: string
  ADDRESS: string
  STATE: string
  CREATED_AT?: Date
  CREATED_BY?: number
  UPDATED_AT?: Date
  UPDATED_BY?: number
}
