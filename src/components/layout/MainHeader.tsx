import React, { useEffect } from 'react'
import styled from 'styled-components'
import CustomHeader from '../custom/CustomHeader'
import CustomRow from '../custom/CustomRow'
import CustomCol from '../custom/CustomCol'
import CustomSpace from '../custom/CustomSpace'
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { CustomText, CustomTitle } from '../custom/CustomParagraph'
import capitalize from 'src/utils/capitalize'
import { getSessionInfo, removeSession } from 'src/lib/session'
import { getAvatarLink } from 'src/utils/get-avatar-link'
import { useSearchParams } from 'react-router-dom'
import CustomAvatar from '../custom/CustomAvatar'
import { useMenuOptionStore } from 'src/store/menu-options.store'
import ConditionalComponent from '../ConditionalComponent'
import UserProfile from '../Profile'
import CustomButton from '../custom/CustomButton'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { usePeopleStore } from 'src/store/people.store'
import CustomPopover from '../custom/CustomPopover'
import CustomDivider from '../custom/CustomDivider'
import { useGeneralStore } from 'src/store/general.store'
import { useAppContext } from 'src/context/AppContext'
// import { ROLE_STUDENT_ID } from 'src/utils/role-path'

const Header = styled(CustomHeader)<{ width: string | number }>`
  display: flex;
  align-items: center;
  height: 72px;
  width: ${({ width }) => width};
  border-radius: 0 !important;
  margin: 0;
  padding: 0 24px !important;
  background: ${({ theme }) =>
    theme.colorBgLayout ||
    theme.baseBgColor ||
    theme.colorBgContainer} !important;
  border-bottom: 1px solid
    ${({ theme }) =>
      theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};
  box-shadow: none;
`

const TriggerButton = styled(CustomButton)`
  width: 44px;
  height: 44px;
  padding-inline: 0 !important;
  border-radius: 12px !important;
`

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`

interface MainHeaderProps {
  width?: string | number
  showLogout?: boolean
}

const MainHeader: React.FC<MainHeaderProps> = ({ width = '100%' }) => {
  const { confirmModal } = useCustomModal()
  const [searchParams, setSearchParams] = useSearchParams()
  const { collapsed, setCollapsed } = useAppContext()

  const { setProfileVisibilitySate, profileVisibilityState } = usePeopleStore()
  const { currenMenuOption, reset } = useMenuOptionStore()
  const { title } = useGeneralStore()
  // const { roleId } = getSessionInfo()
  // const isStudentRole = String(roleId) === ROLE_STUDENT_ID

  useEffect(() => {
    if (!profileVisibilityState && searchParams.get('username')) {
      setProfileVisibilitySate(true)
    }
  }, [profileVisibilityState, searchParams])

  const handleRemoveSession = () => {
    confirmModal({
      type: 'warn',
      title: 'Cerrar Sesión',
      content: 'Seguro que desea cerrar la sesión?',
      onOk: () => {
        removeSession()
        reset()
        window.location.reload()
      },
    })
  }

  const content = (
    <CustomRow>
      <CustomButton
        block
        icon={<UserOutlined />}
        style={{ justifyContent: 'start' }}
        type={'text'}
        onClick={() => {
          setProfileVisibilitySate(true)
          setSearchParams({
            username: getSessionInfo().username,
          })
        }}
      >
        Perfil
      </CustomButton>
      <CustomDivider />
      <CustomButton
        block
        icon={<LogoutOutlined />}
        style={{ justifyContent: 'start' }}
        type={'text'}
        onClick={handleRemoveSession}
      >
        Cerrar Sesión
      </CustomButton>
    </CustomRow>
  )

  return (
    <>
      <Header width={width}>
        <CustomRow
          justify={'space-between'}
          width={'100%'}
          height={'100%'}
          align={'middle'}
        >
          <CustomCol xs={16}>
            <CustomSpace direction="horizontal" size={'middle'} width={null}>
              <ConditionalComponent condition={false}>
                <TriggerButton
                  type="text"
                  icon={
                    collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                  }
                  onClick={() => setCollapsed(!collapsed)}
                />
              </ConditionalComponent>

              <TitleBlock>
                <CustomTitle level={3} style={{ margin: 0 }}>
                  {title ||
                    currenMenuOption?.DESCRIPTION ||
                    currenMenuOption?.NAME}
                </CustomTitle>
              </TitleBlock>
            </CustomSpace>
          </CustomCol>

          <CustomSpace direction="horizontal" width={null}>
            <CustomPopover content={content} trigger={['click', 'hover']}>
              <CustomAvatar
                style={{ cursor: 'pointer' }}
                size={44}
                icon={<UserOutlined />}
                src={getAvatarLink()}
              />
            </CustomPopover>
            <CustomText strong>
              {capitalize(
                getSessionInfo().name || getSessionInfo().username || ''
              )}
            </CustomText>
          </CustomSpace>
        </CustomRow>
      </Header>

      <ConditionalComponent condition={profileVisibilityState}>
        <UserProfile />
      </ConditionalComponent>
    </>
  )
}

export default MainHeader
