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
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTreeSelect from 'src/components/custom/CustomTreeSelect'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomAceEditor from 'src/components/custom/CustomIceEditor'
import { formItemLayout } from 'src/config/breakpoints'
import { NotificationTemplate } from 'src/services/notification-templates/notification-template.types'
import { useCreateNotificationTemplateMutation } from 'src/services/notification-templates/useCreateNotificationTemplateMutation'
import { useUpdateNotificationTemplateMutation } from 'src/services/notification-templates/useUpdateNotificationTemplateMutation'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useAppNotification } from 'src/context/NotificationContext'
import { useMenuOptionStore } from 'src/store/menu-options.store'
import { useGetMenuOptionsWithPermissions } from 'src/services/menu-options/useGetMenuOptionsWithPermissions'
import { AdvancedCondition } from 'src/types/general'
import { notificationTemplateChannelOptions } from '../constants'
import {
  labelColFullWidth,
  defaultBreakpoints,
} from '../../../config/breakpoints'
import { OptionWithPermission } from 'src/services/menu-options/menu-options.types'

type TemplateFormValues = Omit<
  NotificationTemplate,
  'PARAMETERS' | 'DEFAULTS'
> & {
  PARAMETERS?: string
  DEFAULTS?: string
}

interface TemplateFormProps {
  open?: boolean
  template?: NotificationTemplate
  onClose?: () => void
  onSuccess?: () => void
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  open,
  template,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<TemplateFormValues>()
  const [errorHandler] = useErrorHandler()
  const notify = useAppNotification()
  const { menuOptionsWithPermissions } = useMenuOptionStore()

  const { mutateAsync: createTemplate, isPending: isCreatePending } =
    useCreateNotificationTemplateMutation()
  const { mutateAsync: updateTemplate, isPending: isUpdatePending } =
    useUpdateNotificationTemplateMutation()
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
    if (template && open) {
      form.setFieldsValue({
        ...template,
        PARAMETERS: template.PARAMETERS
          ? JSON.stringify(template.PARAMETERS, null, 2)
          : undefined,
        DEFAULTS: template.DEFAULTS
          ? JSON.stringify(template.DEFAULTS, null, 2)
          : undefined,
      })
    } else if (open) {
      form.resetFields()
      form.setFieldValue('STATE', 'A')
    }
  }, [form, template, open])

  const parseJsonField = (value?: string | null) => {
    if (!value) return null
    return JSON.parse(value)
  }

  const handleFinish = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        PARAMETERS: parseJsonField(values.PARAMETERS as never),
        DEFAULTS: parseJsonField(values.DEFAULTS as never),
      }

      if (template?.TEMPLATE_ID) {
        await updateTemplate({
          ...payload,
          TEMPLATE_ID: template.TEMPLATE_ID,
        })
        notify({
          message: 'Operacion exitosa',
          description: 'Plantilla actualizada correctamente.',
        })
      } else {
        await createTemplate(payload)
        notify({
          message: 'Operacion exitosa',
          description: 'Plantilla creada correctamente.',
        })
      }

      form.resetFields()
      onSuccess?.()
      onClose?.()
    } catch (error) {
      errorHandler(error)
    }
  }

  const jsonValidator = (_: unknown, value?: string) => {
    if (!value) return Promise.resolve()

    try {
      JSON.parse(value)
      return Promise.resolve()
    } catch (_error) {
      return Promise.reject(new Error('JSON invalido'))
    }
  }

  return (
    <CustomModal
      open={open}
      onCancel={onClose}
      onOk={handleFinish}
      width={'50%'}
      title={template ? 'Editar plantilla' : 'Registrar plantilla'}
    >
      <CustomSpin
        spinning={isCreatePending || isUpdatePending || isOptionsPending}
      >
        <CustomAlert
          type="info"
          showIcon
          message={
            'Una plantilla te permite reutilizar mensajes y dejar preparados datos dinamicos. Los parametros describen las variables esperadas y los valores por defecto sirven como respaldo cuando una notificacion no envie todos los datos.'
          }
          style={{ marginBottom: 16 }}
        />

        <CustomDivider />
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow gutter={[16, 8]}>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Clave'}
                name={'TEMPLATE_KEY'}
                tooltip="Identificador tecnico unico de la plantilla."
                extra="Recomendado: mayusculas, sin espacios y con guiones bajos."
                rules={[{ required: true }]}
                uppercase
              >
                <CustomInput placeholder={'Ej: ID_TEMPLATE_KEY'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Nombre'}
                name={'NAME'}
                tooltip="Nombre visible para reconocer la plantilla."
                rules={[{ required: true }]}
              >
                <CustomInput placeholder={'Nombre de la plantilla'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Canal'}
                name={'CHANNEL'}
                tooltip="Medio por el que se enviara esta plantilla."
                rules={[{ required: true }]}
              >
                <CustomSelect
                  options={notificationTemplateChannelOptions}
                  placeholder={'Seleccionar canal'}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Opcion de menu'}
                name={'MENU_OPTION_ID'}
                tooltip="Modulo al que deseas asociar esta plantilla."
              >
                <CustomTreeSelect
                  allowClear
                  treeData={menuOptionsList}
                  placeholder={'Seleccionar opcion'}
                  treeDefaultExpandAll
                  showSearch
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Descripcion'}
                name={'DESCRIPTION'}
                tooltip="Explica en que escenario debe usarse esta plantilla."
                {...labelColFullWidth}
              >
                <CustomInput placeholder={'Descripcion de la plantilla'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Asunto'}
                name={'SUBJECT'}
                tooltip="Encabezado del correo o titulo del mensaje."
                rules={[{ max: 255 }]}
                {...labelColFullWidth}
              >
                <CustomInput placeholder={'Asunto del mensaje'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Contenido'}
                name={'BODY'}
                tooltip="Cuerpo del mensaje. Puedes incluir variables dinamicas si las reemplazaras con parametros."
                extra='Ejemplo: Hola {{studentName}}, tu solicitud fue aprobada.'
                rules={[{ required: true }]}
                {...labelColFullWidth}
              >
                <CustomTextArea
                  showCount={false}
                  rows={5}
                  placeholder={'Contenido del mensaje'}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Parametros'}
                name={'PARAMETERS'}
                tooltip="Lista de variables esperadas por la plantilla."
                extra='Ejemplo: {"studentName":"Nombre del becario","amount":"Monto aprobado"}'
                rules={[{ validator: jsonValidator }]}
                {...labelColFullWidth}
              >
                <CustomAceEditor
                  mode={'json'}
                  minLines={8}
                  maxLines={20}
                  placeholder={'{"key":"value"}'}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Valores por defecto'}
                name={'DEFAULTS'}
                tooltip="Datos de respaldo cuando una notificacion no envie alguno de los parametros."
                extra='Ejemplo: {"amount":"Pendiente","studentName":"Estudiante"}'
                rules={[{ validator: jsonValidator }]}
                {...labelColFullWidth}
              >
                <CustomAceEditor
                  mode={'json'}
                  minLines={8}
                  maxLines={20}
                  placeholder={'{"key":"value"}'}
                />
              </CustomFormItem>
            </CustomCol>

            <CustomFormItem
              hidden
              label={'Estado'}
              name={'STATE'}
              initialValue={'A'}
            >
              <CustomSelect
                placeholder={'Seleccionar estado'}
                options={[
                  { label: 'Activo', value: 'A' },
                  { label: 'Inactivo', value: 'I' },
                ]}
              />
            </CustomFormItem>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default TemplateForm
