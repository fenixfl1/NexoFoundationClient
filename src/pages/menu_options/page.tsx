import React, { useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import { EditOutlined, ReloadOutlined } from '@ant-design/icons'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomButton from 'src/components/custom/CustomButton'
import CustomSpace from 'src/components/custom/CustomSpace'
import { OptionWithPermission } from 'src/services/menu-options/menu-options.types'
import { useGetMenuOptionsWithPermissions } from 'src/services/menu-options/useGetMenuOptionsWithPermissions'
import { useUpdateMenuOptionMutation } from 'src/services/menu-options/useUpdateMenuOptionMutation'
import { useMenuOptionStore } from 'src/store/menu-options.store'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useCustomNotifications } from 'src/hooks/use-custom-notification'
import ConditionalComponent from 'src/components/ConditionalComponent'
import MenuOptionForm from './components/MenuOptionForm'
import OptionTree from './components/OptionTree'
import OptionDetail from './components/OptionDetail'
import SVGReader from 'src/components/SVGReader'

const MenuOptionsPage: React.FC = () => {
  const [form] = Form.useForm()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedKey, setSelectedKey] = useState<string>()

  const { menuOptionsWithPermissions } = useMenuOptionStore()
  const { mutate: fetchOptions, isPending: isLoading } =
    useGetMenuOptionsWithPermissions()
  const { mutateAsync: updateMenuOption } = useUpdateMenuOptionMutation()

  const [handleError] = useErrorHandler()
  const { successNotification } = useCustomNotifications()

  const toggleModalState = () => setModalOpen(!modalOpen)

  useEffect(() => {
    fetchOptions({ condition: [], page: 1, size: 500 })
  }, [fetchOptions])

  const findOption = (id?: string): OptionWithPermission | undefined => {
    const dfs = (
      list: OptionWithPermission[]
    ): OptionWithPermission | undefined => {
      for (const item of list) {
        if (item.MENU_OPTION_ID === id) return item
        if (item.CHILDREN?.length) {
          const child = dfs(item.CHILDREN as OptionWithPermission[])
          if (child) return child
        }
      }
      return undefined
    }
    return id
      ? dfs(menuOptionsWithPermissions as OptionWithPermission[])
      : undefined
  }

  const selectedOption = useMemo(
    () => findOption(selectedKey),
    [selectedKey, menuOptionsWithPermissions]
  )

  const treeData = useMemo(() => {
    const term = search.trim().toLowerCase()

    const build = (items: OptionWithPermission[]) =>
      items
        .map((item) => {
          const children = item.CHILDREN
            ? build(item.CHILDREN as OptionWithPermission[])
            : []

          const matches = item.NAME.toLowerCase().includes(term)

          if (term && !matches && !children.length) return null

          return {
            children,
            icon: <SVGReader svg={item.ICON ?? ''} />,
            key: item.MENU_OPTION_ID,
            title: item.NAME,
          }
        })
        .filter(Boolean)

    return build(menuOptionsWithPermissions as OptionWithPermission[])
  }, [menuOptionsWithPermissions, search])

  // const openCreateModal = () => {
  //   form?.resetFields?.()
  //   form?.setFieldsValue?.({
  //     TYPE: 'item',
  //     STATE_BOOL: true,
  //     ORDER: 1,
  //     PARENT_ID: selectedOption?.MENU_OPTION_ID,
  //   })
  //   setModalOpen(true)
  // }

  const openEditModal = () => {
    if (!selectedOption?.MENU_OPTION_ID) return
    form?.setFieldsValue?.({
      ...selectedOption,
      STATE_BOOL: selectedOption.STATE !== 'I',
      PARENT_ID: selectedOption.PARENT_ID ?? undefined,
    })
    toggleModalState()
  }

  const handleToggleState = async () => {
    if (!selectedOption) return
    try {
      await updateMenuOption({
        MENU_OPTION_ID: selectedOption.MENU_OPTION_ID,
        STATE: selectedOption.STATE === 'A' ? 'I' : 'A',
      })
      successNotification({
        message: 'Estado actualizado',
        description: 'La opción fue actualizada correctamente.',
      })
      fetchOptions({ condition: [], page: 1, size: 500 })
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <>
      <CustomRow gap={10}>
        <CustomCol xs={24}>
          <CustomRow justify="end" align="middle" style={{ marginBottom: 12 }}>
            <CustomCol>
              <CustomSpace direction={'horizontal'} width={'100%'}>
                <CustomButton
                  icon={<ReloadOutlined />}
                  loading={isLoading}
                  onClick={() =>
                    fetchOptions({ condition: [], page: 1, size: 500 })
                  }
                >
                  Refrescar
                </CustomButton>
                <CustomButton
                  icon={<EditOutlined />}
                  onClick={openEditModal}
                  disabled={!selectedOption?.MENU_OPTION_ID}
                >
                  Editar
                </CustomButton>
              </CustomSpace>
            </CustomCol>
          </CustomRow>
        </CustomCol>

        <CustomCol xs={24}>
          <CustomRow gutter={16} align={'top'}>
            <CustomCol xs={24} md={8}>
              <OptionTree
                treeData={treeData}
                onSearch={setSearch}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
              />
            </CustomCol>

            <CustomCol xs={24} md={16}>
              <OptionDetail
                selectedOption={selectedOption}
                onChange={handleToggleState}
              />
            </CustomCol>
          </CustomRow>
        </CustomCol>
      </CustomRow>

      <ConditionalComponent condition={modalOpen}>
        <MenuOptionForm
          form={form}
          onClose={toggleModalState}
          open={modalOpen}
          current={selectedOption}
        />
      </ConditionalComponent>
    </>
  )
}

export default MenuOptionsPage
