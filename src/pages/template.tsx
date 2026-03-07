import React, { useEffect } from 'react'
import CustomSider from 'src/components/custom/CustomSider'
import CustomLayout from 'src/components/custom/CustomLayout'
import CustomMenu from 'src/components/custom/CustomMenu'
import CustomContent from 'src/components/custom/CustomContent'
import styled from 'styled-components'
import ConditionalComponent from 'src/components/ConditionalComponent'
import ThemeTransitionLayout from 'src/components/ThemeTransition'
import { useAppContext } from 'src/context/AppContext'
import { useGetUserMenuOptionsQuery } from 'src/services/menu-options/useGetUserMenuOptionsQuery'
import { MenuOption } from 'src/services/menu-options/menu-options.types'
import SVGReader from 'src/components/SVGReader'
import {
  useNavigate,
  useNavigation,
  useParams,
  useSearchParams,
} from 'react-router'
import { useMenuOptionStore } from 'src/store/menu-options.store'
import { findParentKeys } from 'src/utils/find-parent-keys'
import { MenuProps } from 'antd'
import CustomDivider from 'src/components/custom/CustomDivider'
import { usePeopleStore } from 'src/store/people.store'
import MainHeader from 'src/components/layout/MainHeader'
import CustomSpin from 'src/components/custom/CustomSpin'
import { CustomText } from 'src/components/custom/CustomParagraph'
import { getCurrentRoleBasePath, ROLE_STUDENT_ID } from 'src/utils/role-path'
import { getSessionInfo } from 'src/lib/session'
import { addRecentMenuOption } from 'src/utils/recent-menu'

const Shell = styled(CustomLayout)`
  height: 100vh !important;
  padding: 0;
  gap: 0;
  background: ${({ theme }) => theme.colorBgLayout || theme.baseBgColor};
`

const LogoWrapper = styled.div<{ $collapsed: boolean }>`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 0;
`

const LogoContainer = styled.div<{ $collapsed: boolean }>`
  height: ${({ $collapsed }) => ($collapsed ? '68px' : '96px')};
  display: flex;
  justify-content: center;
  align-items: center;
  padding-inline: ${({ $collapsed }) => ($collapsed ? '8px' : '16px')};
  transition: all 0.2s ease;

  img {
    width: ${({ $collapsed }) => ($collapsed ? '46px' : '78%')};
    max-width: ${({ $collapsed }) => ($collapsed ? '46px' : '190px')};
    transition: all 0.2s ease;
    filter: ${({ theme: { isDark } }) => (isDark ? 'invert(100%)' : undefined)};
  }
`

const Content = styled(CustomContent)`
  overflow: initial;
  padding: 0;
  margin: 0 auto;
  min-height: auto;
  width: 100%;
  max-width: 1480px;
  background: transparent;
  border: 0;
  box-shadow: none;
  box-sizing: border-box;
`

const BodyContainer = styled.div`
  min-width: 0;
  flex: 1;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  box-sizing: border-box !important;
`

const Viewport = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  box-sizing: border-box !important;
`

const Sider = styled(CustomSider)<{ $collapsed: boolean }>`
  height: 100vh !important;
  box-shadow: none;
  border-radius: 0 !important;
  border-right: 1px solid
    ${({ theme }) =>
      theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};
  padding: ${({ $collapsed }) =>
    $collapsed ? '12px 6px 16px' : '12px 10px 16px'} !important;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 10px !important;
  background: ${({ theme }) =>
    theme.isDark ? '#001529' : theme.colorBgContainer} !important;
  transition: all 0.2s ease;

  .menu-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding-bottom: 8px;
  }
`

const Menu = styled(CustomMenu)`
  border-right: 0;
  background-color: transparent !important;
  width: 100%;

  &.ant-menu-inline-collapsed {
    .ant-menu-title-content,
    .ant-menu-submenu-arrow {
      display: none !important;
    }
  }
`

const RootTemplate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { activityId } = useParams()
  const navigate = useNavigate()
  const navigation = useNavigation()
  const { isAuthenticated, theme, collapsed, setCollapsed } = useAppContext()
  const [searchParams] = useSearchParams()
  const { roleId } = getSessionInfo()
  const isStudentRole = String(roleId) === ROLE_STUDENT_ID

  useGetUserMenuOptionsQuery()

  const {
    setCurrentMenuOption,
    currenMenuOption,
    menuOptions,
    setOpenKeys,
    setSelectedKeys,
    openKeys,
    selectedKeys,
  } = useMenuOptionStore()

  const { setProfileVisibilitySate, profileVisibilityState } = usePeopleStore()

  useEffect(() => {
    if (!profileVisibilityState && searchParams.get('username')) {
      setProfileVisibilitySate(true)
    }
  }, [profileVisibilityState, searchParams])

  useEffect(() => {
    let current = currenMenuOption
    if (currenMenuOption?.MENU_OPTION_ID !== activityId) {
      current = menuOptions.find((item) => item?.MENU_OPTION_ID === activityId)
    }
    const keys = findParentKeys(menuOptions, [
      current?.MENU_OPTION_ID,
    ]) as string[]
    setOpenKeys([...keys, current?.PARENT_ID, current?.MENU_OPTION_ID])
    setSelectedKeys([current?.MENU_OPTION_ID])
  }, [currenMenuOption])

  useEffect(() => {
    if (
      activityId !== currenMenuOption?.MENU_OPTION_ID ||
      !currenMenuOption?.MENU_OPTION_ID
    ) {
      setCurrentMenuOption(
        menuOptions.find((item) => item.MENU_OPTION_ID === activityId)
      )
    }
  }, [activityId, menuOptions])

  useEffect(() => {
    if (isStudentRole && collapsed) {
      setCollapsed(false)
    }
  }, [collapsed, isStudentRole, setCollapsed])

  const handleClickOption = (option: MenuOption) => {
    if (option?.CHILDREN?.length) return

    setCurrentMenuOption(option)
    addRecentMenuOption(option)
    const basePath = getCurrentRoleBasePath()
    navigate(`${basePath}${option.PATH}`)
  }

  const getSubMenu = (options: MenuOption[]): MenuProps['items'] => {
    return options?.map((option: MenuOption) => {
      const hasChildren = !!option.CHILDREN?.length

      if (isStudentRole && hasChildren) {
        return {
          key: option?.MENU_OPTION_ID,
          type: 'group',
          label: (
            <CustomText>
              {option.ICON ? <SVGReader svg={option.ICON} /> : null}{' '}
              {option.NAME}
            </CustomText>
          ),
          children: getSubMenu(option?.CHILDREN),
        }
      }

      return {
        key: option?.MENU_OPTION_ID,
        title: option.NAME,
        type: option.TYPE,
        icon: option.ICON ? <SVGReader svg={option.ICON} /> : undefined,
        onClick: hasChildren ? undefined : () => handleClickOption(option),
        children: hasChildren ? getSubMenu(option?.CHILDREN) : undefined,
        label: option.NAME,
      }
    })
  }

  const items = getSubMenu(menuOptions)
  const getLevelKeys = (items1: MenuProps['items']) => {
    const key: Record<string, number> = {}
    const func = (items2: MenuProps['items'], level = 1) => {
      items2.forEach((item) => {
        if (item?.key) {
          key[item.key?.toString()] = level
        }
        if (item?.['children']) {
          func(item?.['children'], level + 1)
        }
      })
    }
    func(items1)
    return key
  }

  const levelKeys = getLevelKeys(items)

  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    const currentOpenKey = keys.find((key) => openKeys.indexOf(key) === -1)
    if (currentOpenKey !== undefined) {
      const repeatIndex = keys
        .filter((key) => key !== currentOpenKey)
        .findIndex((key) => levelKeys[key] === levelKeys[currentOpenKey])

      setOpenKeys(
        keys
          .filter((_, index) => index !== repeatIndex)
          .filter((key) => levelKeys[key] <= levelKeys[currentOpenKey])
      )
    } else {
      setOpenKeys(keys)
    }
  }

  return (
    <>
      <ConditionalComponent
        condition={isAuthenticated}
        fallback={<>{children}</>}
      >
        <ThemeTransitionLayout>
          <CustomSpin
            tip={'Cargando...'}
            spinning={navigation.state === 'loading'}
          >
            <Shell>
              <Sider
                $collapsed={!isStudentRole && collapsed}
                collapsible={!isStudentRole}
                collapsed={!isStudentRole ? collapsed : false}
                collapsedWidth={88}
                trigger={null}
                width={256}
                theme={theme}
              >
                <LogoWrapper $collapsed={!isStudentRole && collapsed}>
                  <LogoContainer $collapsed={!isStudentRole && collapsed}>
                    <img src={'/assets/logo.png'} />
                  </LogoContainer>
                  <CustomDivider />
                </LogoWrapper>
                <div className="menu-container">
                  <Menu
                    mode={'inline'}
                    inlineCollapsed={!isStudentRole ? collapsed : false}
                    openKeys={isStudentRole || collapsed ? undefined : openKeys}
                    selectedKeys={selectedKeys}
                    items={items}
                    onOpenChange={isStudentRole ? undefined : handleOpenChange}
                  />
                </div>
              </Sider>
              <BodyContainer>
                <MainHeader />
                <Viewport>
                  <Content>{children}</Content>
                </Viewport>
              </BodyContainer>
            </Shell>
          </CustomSpin>
        </ThemeTransitionLayout>
      </ConditionalComponent>
    </>
  )
}

export default RootTemplate
