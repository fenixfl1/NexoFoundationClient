import { FormInstance } from 'antd/lib'
import React, { useMemo } from 'react'
import CustomAlert from 'src/components/custom/CustomAlert'
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
  const [errorHandler] = useErrorHandler()
  const { successNotification } = useCustomNotifications()

  const { mutate: fetchOptions, isPending: isLoading } =
    useGetMenuOptionsWithPermissions()
  const { mutateAsync: saveOption, isPending: isSaving } =
    useUpdateMenuOptionMutation()

  const { menuOptionsWithPermissions } = useMenuOptionStore()

  const blockedParentIds = useMemo(() => {
    const ids = new Set<string>()

    const collect = (option?: OptionWithPermission) => {
      if (!option?.MENU_OPTION_ID) {
        return
      }

      ids.add(option.MENU_OPTION_ID)
      option.CHILDREN?.forEach((child) => collect(child as OptionWithPermission))
    }

    collect(current)
    return ids
  }, [current])

  const parentTreeData = useMemo(() => {
    const build = (items: OptionWithPermission[]) =>
      items
        .filter((item) => !blockedParentIds.has(item.MENU_OPTION_ID))
        .map((item) => ({
          value: item.MENU_OPTION_ID,
          title: `${item.MENU_OPTION_ID} - ${item.NAME}`,
          children: item.CHILDREN
            ? build(item.CHILDREN as OptionWithPermission[])
            : [],
        }))

    return build(menuOptionsWithPermissions as OptionWithPermission[])
  }, [blockedParentIds, menuOptionsWithPermissions])

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      await saveOption({
        ...values,
        MENU_OPTION_ID: current?.MENU_OPTION_ID,
      })
      successNotification({
        message: 'Opcion guardada',
        description: 'Los cambios se aplicaron correctamente.',
      })
      onClose?.()
      fetchOptions({ condition: [], page: 1, size: 500 })
    } catch (error) {
      errorHandler(error)
    }
  }

  return (
    <CustomModal
      open={open}
      title={'Editar opcion de menu'}
      onCancel={onClose}
      onOk={() => form?.submit?.()}
      preventClose={false}
    >
      <CustomSpin spinning={isLoading || isSaving}>
        <CustomAlert
          type="info"
          showIcon
          message={
            'Usa este formulario para ajustar como se muestra la opcion en el menu. El nombre es lo que vera el usuario, la ruta es la direccion que abre el sistema, el tipo define su comportamiento y el padre indica en que nivel del arbol quedara.'
          }
          style={{ marginBottom: 16 }}
        />

        <CustomForm
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ TYPE: 'item', ORDER: 1 }}
        >
          <CustomFormItem
            label="Nombre"
            name="NAME"
            tooltip="Texto visible para el usuario dentro del menu."
            extra="Procura que sea corto y facil de reconocer."
            rules={[{ required: true, message: 'Ingresa un nombre' }]}
          >
            <CustomInput maxLength={100} placeholder="Ej. Actividades" />
          </CustomFormItem>

          <CustomFormItem
            label="Descripcion"
            name="DESCRIPTION"
            tooltip="Ayuda a entender el proposito de la opcion al revisarla despues."
            extra="Puedes describir brevemente que hace este acceso."
            rules={[{ required: true, message: 'Ingresa una descripcion' }]}
          >
            <CustomTextArea rows={2} maxLength={250} />
          </CustomFormItem>

          <CustomFormItem
            label="Ruta"
            name="PATH"
            tooltip="Direccion completa que abre esta opcion dentro del sistema."
            extra="Si ya existe, conviene conservar la estructura actual y solo cambiarla si sabes exactamente que pantalla debe abrir."
          >
            <CustomInput placeholder="/0-1/activities" maxLength={100} />
          </CustomFormItem>

          <CustomRow gutter={12}>
            <CustomCol span={12}>
              <CustomFormItem
                label="Tipo"
                name="TYPE"
                tooltip="Define si la opcion abre una pantalla, agrupa otras opciones o solo organiza el menu."
                extra="Item abre una vista; submenu y grupo ordenan otras opciones."
              >
                <CustomSelect
                  options={[
                    { label: 'Item', value: 'item' },
                    { label: 'Submenu', value: 'submenu' },
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
                tooltip="Numero que controla la posicion dentro del mismo nivel."
                extra="Los numeros menores aparecen primero."
                rules={[{ required: true, message: 'Define un orden' }]}
              >
                <CustomInputNumber min={0} style={{ width: '100%' }} />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>

          <CustomFormItem
            label="Padre"
            name="PARENT_ID"
            tooltip="Permite mover la opcion a otro nivel del arbol."
            extra="No se muestran la opcion actual ni sus hijos para evitar jerarquias invalidas."
          >
            <CustomTreeSelect
              allowClear
              treeDefaultExpandAll
              placeholder="Sin padre (nivel raiz)"
              treeData={parentTreeData}
            />
          </CustomFormItem>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default MenuOptionForm
