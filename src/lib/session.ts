import Cookies from 'js-cookie'
import moment from 'moment'
import { Business } from 'src/services/users/users.types'

const COOKIE_KEY_USER_NAME = 'appUsername'
const COOKIE_KEY_USER_DATA = 'appUserData'
const COOKIE_KEY_SESSION_TOKEN = 'appSession'
const COOKE_KEY_BUSINESS_INFO = 'appBusiness'

export const isLoggedIn = (): boolean => {
  const requiredCookiesKeys = [COOKIE_KEY_SESSION_TOKEN, COOKIE_KEY_USER_DATA]

  return !requiredCookiesKeys.some(
    (cookieKey) => Cookies.get(cookieKey) === undefined
  )
}

export type UserData = {
  username: string
  userId: string
  name: string
  avatar: string
  roleId: string
  business: Business
  personId: string
  sessionCookie: {
    token: string
    expiration: string
  }
}

export const createSession = async (user: UserData): Promise<void> => {
  const { username, sessionCookie, userId, avatar, business, ...restProps } =
    user
  const { token: sessionToken, expiration: sessionExpiration } = sessionCookie
  const expires = new Date(sessionExpiration)
  const sessionInfo = JSON.stringify({
    username,
    userId,
    ...restProps,
  })

  const { LOGO, ...businessInfo } = business

  localStorage.setItem('avatar', avatar)
  localStorage.setItem('businessLogo', LOGO)

  Cookies.set(COOKIE_KEY_USER_DATA, sessionInfo, { expires })
  Cookies.set(COOKIE_KEY_SESSION_TOKEN, sessionToken, { expires })
  Cookies.set(COOKE_KEY_BUSINESS_INFO, JSON.stringify(businessInfo), {
    expires,
  })
  Cookies.set(COOKIE_KEY_USER_NAME, username, {
    expires: new Date(moment(expires).add(-1, 'minutes').toISOString()),
  })
}

export const removeSession = (): void => {
  const requiredCookiesKeys = [
    COOKIE_KEY_SESSION_TOKEN,
    COOKIE_KEY_USER_DATA,
    COOKIE_KEY_USER_NAME,
  ]

  localStorage.removeItem('avatar')
  requiredCookiesKeys.forEach((cookieKey) => Cookies.remove(cookieKey))
}

/**@description obtiene los datos de la sesión del usuario actualmente conectado */
export const getSessionInfo = (): UserData => {
  if (!isLoggedIn()) {
    return <UserData>{}
  }

  const avatar = localStorage.getItem('avatar') || ''
  const userData = JSON.parse(Cookies.get(COOKIE_KEY_USER_DATA))
  return {
    ...userData,
    avatar,
  }
}

export const getSessionToken = (): string => {
  return Cookies.get(COOKIE_KEY_SESSION_TOKEN) || ''
}

export const getBusinessInfo = (): Business => {
  try {
    const business = JSON.parse(Cookies.get(COOKE_KEY_BUSINESS_INFO) || '{}')
    business.LOGO = localStorage.getItem('businessLogo')

    return business
  } catch {
    return <Business>{}
  }
}
