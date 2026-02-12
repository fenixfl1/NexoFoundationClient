import { FormInstance } from 'antd/lib'
import React, { useMemo } from 'react'
import CustomCol from 'src/components/custom/CustomCol'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomInputNumber from 'src/components/custom/CustomInputNumber'
import CustomModal from 'src/components/custom/CustomModal'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTextArea from 'src/components/custom/CustomTextArea'
import CustomTreeSelect from 'src/components/custom/CustomTreeSelect'
import { useCustomNotifications } from 'src/hooks/use-custom-notification'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { OptionWithPermission } from 'src/services/menu-options/menu-options.types'
import { useGetMenuOptionsWithPermissions } from 'src/services/menu-options/useGetMenuOptionsWithPermissions'
import { useUpdateMenuOptionMutation } from 'src/services/menu-options/useUpdateMenuOptionMutation'
import { useMenuOptionStore } from 'src/store/menu-options.store'

interface MenuOptionFormProps {
  form: FormInstance
  open: boolean
  current?: OptionWithPermission
  onClose?: () => void
}

const MenuOptionForm: React.FC<MenuOptionFormProps> = ({
  current,
  form,
  open,
  onClose,
}) => {
  const [erroHandler] = useErrorHandler()
  const { successNotification } = useCustomNotifications()

  const { mutate: fetchOptions, isPending: isLoading } =
    useGetMenuOptionsWithPermissions()
  const { mutateAsync: saveOption, isPending: isSaving } =
    useUpdateMenuOptionMutation()

  const { menuOptionsWithPermissions } = useMenuOptionStore()

  const parentTreeData = useMemo(() => {
    const build = (items: OptionWithPermission[]) =>
      items.map((item) => ({
        value: item.MENU_OPTION_ID,
        title: `${item.MENU_OPTION_ID} — ${item.NAME}`,
        children: item.CHILDREN
          ? build(item.CHILDREN as OptionWithPermission[])
          : [],
      }))
    return build(menuOptionsWithPermissions as OptionWithPermission[])
  }, [menuOptionsWithPermissions])

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      await saveOption({
        ...values,
        MENU_OPTION_ID: current?.MENU_OPTION_ID,
      })
      successNotification({
        message: 'Opción guardada',
        description: 'Los cambios se aplicaron correctamente.',
      })
      onClose?.()
      fetchOptions({ condition: [], page: 1, size: 500 })
    } catch (error) {
      erroHandler(error)
    }
  }

  return (
    <CustomModal
      open={open}
      title={'Editar opción de menú'}
      onCancel={onClose}
      onOk={() => form?.submit?.()}
      preventClose={false}
    >
      <CustomSpin spinning={isLoading || isSaving}>
        <CustomForm
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ TYPE: 'item', STATE_BOOL: true, ORDER: 1 }}
        >
          <CustomFormItem
            label="Nombre"
            name="NAME"
            rules={[{ required: true, message: 'Ingresa un nombre' }]}
          >
            <CustomInput maxLength={100} placeholder="Ej. Actividades" />
          </CustomFormItem>

          <CustomFormItem
            label="Descripción"
            name="DESCRIPTION"
            rules={[{ required: true, message: 'Ingresa una descripción' }]}
          >
            <CustomTextArea rows={2} maxLength={250} />
          </CustomFormItem>

          <CustomFormItem
            label="Ruta (PATH)"
            name="PATH"
            tooltip="Se concatena con el id generado. Ej: /activities"
          >
            <CustomInput placeholder="/activities" maxLength={100} />
          </CustomFormItem>

          <CustomRow gutter={12}>
            <CustomCol span={12}>
              <CustomFormItem
                label="Tipo"
                name="TYPE"
                // rules={[{ required: true }]}
              >
                <CustomSelect
                  options={[
                    { label: 'Item', value: 'item' },
                    { label: 'Submenú', value: 'submenu' },
                    { label: 'Grupo', value: 'group' },
                    { label: 'Divider', value: 'divider' },
                    { label: 'Link', value: 'link' },
                  ]}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol span={12}>
              <CustomFormItem
                label="Orden"
                name="ORDER"
                rules={[{ required: true, message: 'Define un orden' }]}
              >
                <CustomInputNumber min={0} style={{ width: '100%' }} />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>

          <CustomFormItem label="Padre" name="PARENT_ID">
            <CustomTreeSelect
              allowClear
              treeDefaultExpandAll
              placeholder="Sin padre (nivel raíz)"
              treeData={parentTreeData}
            />
          </CustomFormItem>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default MenuOptionForm
