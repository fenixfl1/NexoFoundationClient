import React, { useEffect, useMemo } from 'react'
import { Form } from 'antd'
import CustomAlert from 'src/components/custom/CustomAlert'
import CustomModal from 'src/components/custom/CustomModal'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomTextArea from 'src/components/custom/CustomTextArea'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDivider from 'src/components/custom/CustomDivider'
import { formItemLayout } from 'src/config/breakpoints'
import { Parameter } from 'src/services/parameter/parameter.types'
import { useCreateParameterMutation } from 'src/services/parameter/useCreateParameterMutation'
import { useUpdateParameterMutation } from 'src/services/parameter/useUpdateParameterMutation'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import CustomSpin from 'src/components/custom/CustomSpin'
import { useMenuOptionStore } from 'src/store/menu-options.store'
import { useAppNotification } from 'src/context/NotificationContext'
import { useGetMenuOptionsWithPermissions } from 'src/services/menu-options/useGetMenuOptionsWithPermissions'
import { AdvancedCondition } from 'src/types/general'
import CustomTreeSelect from 'src/components/custom/CustomTreeSelect'
import CustomSelect from 'src/components/custom/CustomSelect'
import { OptionWithPermission } from 'src/services/menu-options/menu-options.types'

interface ParameterFormProps {
  open?: boolean
  parameter?: Parameter
  onClose?: () => void
  onSuccess?: () => void
}

const ParameterForm: React.FC<ParameterFormProps> = ({
  open,
  parameter,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<Parameter>()
  const [errorHandler] = useErrorHandler()
  const notify = useAppNotification()
  const { menuOptionsWithPermissions } = useMenuOptionStore()

  const { mutateAsync: createParameter, isPending: isCreatePending } =
    useCreateParameterMutation()
  const { mutateAsync: updateParameter, isPending: isUpdatePending } =
    useUpdateParameterMutation()
  const { mutate: getMenuOptionsWithPermissions, isPending: isOptionsPending } =
    useGetMenuOptionsWithPermissions()

  const handleGetMenuOptions = React.useCallback(() => {
    const condition: AdvancedCondition[] = [
      { field: 'STATE', operator: '=', value: 'A' },
    ]

    getMenuOptionsWithPermissions({ page: 1, size: 200, condition })
  }, [getMenuOptionsWithPermissions])

  useEffect(() => {
    if (open) {
      handleGetMenuOptions()
    }
  }, [open, handleGetMenuOptions])

  const menuOptionsList = useMemo(() => {
    const build = (items: OptionWithPermission[]) =>
      items.map((item) => ({
        title: `${item.MENU_OPTION_ID} - ${item.NAME}`,
        value: item.MENU_OPTION_ID,
        key: item.MENU_OPTION_ID,
        children: item.CHILDREN?.length
          ? build(item.CHILDREN as OptionWithPermission[])
          : [],
      }))

    return build(menuOptionsWithPermissions as OptionWithPermission[])
  }, [menuOptionsWithPermissions])

  useEffect(() => {
    if (parameter && open) {
      form.setFieldsValue({
        ...parameter,
      })
    } else if (open) {
      form.resetFields()
      form.setFieldValue('STATE', 'A')
    }
  }, [form, parameter, open])

  const handleFinish = async () => {
    try {
      const data = await form.validateFields()

      if (parameter?.PARAMETER_ID) {
        await updateParameter({
          ...data,
          PARAMETER_ID: parameter.PARAMETER_ID,
        })
        notify({
          message: 'Operacion exitosa',
          description: 'Parametro actualizado correctamente.',
        })
      } else {
        await createParameter(data)
        notify({
          message: 'Operacion exitosa',
          description: 'Parametro creado correctamente.',
        })
      }

      form.resetFields()
      onClose?.()
      onSuccess?.()
    } catch (error) {
      errorHandler(error)
    }
  }

  return (
    <CustomModal
      open={open}
      onCancel={onClose}
      onOk={handleFinish}
      width={'40%'}
      title={parameter ? 'Editar parametro' : 'Registrar nuevo parametro'}
    >
      <CustomSpin
        spinning={isCreatePending || isUpdatePending || isOptionsPending}
      >
        <CustomAlert
          type="info"
          showIcon
          message={
            'Un parametro guarda configuraciones que luego usa un modulo del sistema. La clave suele ser tecnica y sin espacios, mientras que el valor puede ser texto, ids, listas separadas por comas o incluso JSON, segun lo que necesite esa pantalla.'
          }
          style={{ marginBottom: 16 }}
        />

        <CustomDivider />
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow gutter={[16, 8]}>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Opcion de menu'}
                name={'MENU_OPTION_ID'}
                tooltip="Modulo o pantalla a la que pertenecera este parametro."
                extra="Puedes elegir cualquier nivel del arbol."
                rules={[{ required: true }]}
              >
                <CustomTreeSelect
                  treeData={menuOptionsList}
                  placeholder={'Seleccionar opcion'}
                  treeDefaultExpandAll
                  showSearch
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                uppercase
                label={'Parametro'}
                name={'PARAMETER'}
                tooltip="Clave interna que usa el sistema para leer este valor."
                extra="Recomendado: mayusculas, sin espacios y con guiones bajos. Ejemplo: ID_LIST_STATES"
                rules={[{ required: true }]}
                noSpaces
              >
                <CustomInput placeholder={'Ej: ID_LIST_STATES'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Descripcion'}
                name={'DESCRIPTION'}
                tooltip="Explica para que sirve este parametro."
                extra="Esto ayuda bastante cuando luego haya que editarlo o revisarlo."
              >
                <CustomInput placeholder={'Descripcion del parametro'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Valor'}
                name={'VALUE'}
                tooltip="Contenido que consumira el modulo."
                extra="Puedes guardar un texto simple, una lista de ids o una estructura JSON si ese modulo lo requiere."
              >
                <CustomTextArea rows={3} placeholder={'Valor'} showCount={false} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Estado'}
                name={'STATE'}
                tooltip="Define si el parametro sigue disponible para usarse."
              >
                <CustomSelect
                  placeholder={'Seleccionar estado'}
                  options={[
                    { label: 'Activo', value: 'A' },
                    { label: 'Inactivo', value: 'I' },
                  ]}
                />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default ParameterForm
