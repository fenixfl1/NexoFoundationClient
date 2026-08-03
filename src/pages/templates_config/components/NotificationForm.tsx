import React, { useEffect, useMemo } from 'react'
import { Form } from 'antd'
import dayjs from 'dayjs'
import CustomAlert from 'src/components/custom/CustomAlert'
import CustomModal from 'src/components/custom/CustomModal'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomTextArea from 'src/components/custom/CustomTextArea'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomDatePicker from 'src/components/custom/CustomDatePicker'
import CustomIceEditor from 'src/components/custom/CustomIceEditor'
import {
  defaultBreakpoints,
  formItemLayout,
  labelColFullWidth,
} from 'src/config/breakpoints'
import { useNotificationTemplateStore } from 'src/store/notification-template.store'
import {
  notificationChannelOptions,
  notificationStatusOptions,
} from '../constants'
import { NotificationItem } from 'src/services/notifications/notification.types'
import { useCreateNotificationMutation } from 'src/services/notifications/useCreateNotificationMutation'
import { useUpdateNotificationMutation } from 'src/services/notifications/useUpdateNotificationMutation'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useAppNotification } from 'src/context/NotificationContext'

type NotificationFormValues = Omit<
  NotificationItem,
  'PAYLOAD' | 'SCHEDULED_AT'
> & {
  PAYLOAD?: string
  SCHEDULED_AT?: dayjs.Dayjs
}

interface NotificationFormProps {
  open?: boolean
  notification?: NotificationItem
  onClose?: () => void
  onSuccess?: () => void
}

const NotificationForm: React.FC<NotificationFormProps> = ({
  open,
  notification,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<NotificationFormValues>()
  const [errorHandler] = useErrorHandler()
  const notify = useAppNotification()
  const { templates } = useNotificationTemplateStore()
  const compactBreakpoints = {
    xs: 24,
    md: 8,
    xl: 6,
  }

  const { mutateAsync: createNotification, isPending: isCreatePending } =
    useCreateNotificationMutation()
  const { mutateAsync: updateNotification, isPending: isUpdatePending } =
    useUpdateNotificationMutation()

  const activeTemplates = useMemo(
    () => templates.filter((tpl) => tpl.STATE === 'A'),
    [templates]
  )

  useEffect(() => {
    if (notification && open) {
      form.setFieldsValue({
        ...notification,
        PAYLOAD: notification.PAYLOAD
          ? JSON.stringify(notification.PAYLOAD, null, 2)
          : undefined,
        SCHEDULED_AT: notification.SCHEDULED_AT
          ? dayjs(notification.SCHEDULED_AT)
          : undefined,
      })
    } else if (open) {
      form.resetFields()
      form.setFieldsValue({ STATUS: 'P', STATE: 'A' })
    }
  }, [form, notification, open])

  const selectedTemplateId = Form.useWatch('TEMPLATE_ID', form)

  useEffect(() => {
    if (!selectedTemplateId) return

    const template = templates.find(
      (tpl) => tpl.TEMPLATE_ID === selectedTemplateId
    )

    if (template) {
      form.setFieldsValue({
        CHANNEL: template.CHANNEL,
        SUBJECT: template.SUBJECT,
        BODY: template.BODY,
      })
    }
  }, [form, selectedTemplateId, templates])

  const parseJsonField = (value?: string | null) => {
    if (!value) return null
    return JSON.parse(value)
  }

  const handleFinish = async () => {
    try {
      const values = await form.validateFields()

      const payload = {
        ...values,
        PAYLOAD: parseJsonField(values.PAYLOAD as never),
        SCHEDULED_AT: values.SCHEDULED_AT
          ? values.SCHEDULED_AT.toISOString()
          : null,
      }

      if (notification?.NOTIFICATION_ID) {
        await updateNotification({
          ...payload,
          NOTIFICATION_ID: notification.NOTIFICATION_ID,
        })
        notify({
          message: 'Operacion exitosa',
          description: 'Notificación actualizada correctamente.',
        })
      } else {
        await createNotification(payload)
        notify({
          message: 'Operacion exitosa',
          description: 'Notificación registrada correctamente.',
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
      title={notification ? 'Editar notificación' : 'Registrar notificación'}
    >
      <CustomSpin spinning={isCreatePending || isUpdatePending}>
        <CustomAlert
          type="info"
          showIcon
          message={
            'Puedes crear una notificación desde cero o apoyarte en una plantilla. Si eliges una plantilla, se completan automáticamente el canal, el asunto y el contenido. El payload permite enviar datos dinámicos para reemplazar variables dentro del mensaje.'
          }
          style={{ marginBottom: 16 }}
        />

        <CustomDivider />
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow gutter={[16, 8]}>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Plantilla'}
                name={'TEMPLATE_ID'}
                tooltip="Úsala cuando quieras reutilizar una estructura ya preparada."
              >
                <CustomSelect
                  allowClear
                  placeholder={'Seleccionar plantilla'}
                  options={activeTemplates.map((tpl) => ({
                    label: `${tpl.NAME} (${tpl.CHANNEL})`,
                    value: tpl.TEMPLATE_ID,
                  }))}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Canal'}
                name={'CHANNEL'}
                tooltip="Medio por el cual se enviara la notificación."
                dependencies={['TEMPLATE_ID']}
                rules={[
                  {
                    validator: (_, value) => {
                      if (value || form.getFieldValue('TEMPLATE_ID')) {
                        return Promise.resolve()
                      }
                      return Promise.reject(
                        new Error('Seleccione un canal o una plantilla.')
                      )
                    },
                  },
                ]}
              >
                <CustomSelect
                  placeholder={'Seleccionar canal'}
                  options={notificationChannelOptions}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Destinatario'}
                name={'RECIPIENT'}
                tooltip="Correo o destino al que se enviara el mensaje."
                rules={[{ required: true }]}
                {...labelColFullWidth}
              >
                <CustomInput placeholder={'correo@dominio.com'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Asunto'}
                name={'SUBJECT'}
                tooltip="Titulo del correo o encabezado principal del mensaje."
                {...labelColFullWidth}
              >
                <CustomInput placeholder={'Asunto del mensaje'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                {...labelColFullWidth}
                label={'Contenido'}
                name={'BODY'}
                tooltip="Texto o HTML que se enviara al destinatario."
                extra="Si usas plantilla, aquí veras y podrás ajustar el contenido generado."
                dependencies={['TEMPLATE_ID']}
                rules={[
                  {
                    validator: (_, value) => {
                      if (value || form.getFieldValue('TEMPLATE_ID')) {
                        return Promise.resolve()
                      }
                      return Promise.reject(
                        new Error(
                          'Proporcione el contenido o seleccione una plantilla.'
                        )
                      )
                    },
                  },
                ]}
              >
                <CustomTextArea
                  rows={5}
                  placeholder={'Contenido del mensaje'}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Payload (JSON)'}
                name={'PAYLOAD'}
                tooltip="Datos adicionales para completar variables dinámicas dentro del mensaje."
                extra='Ejemplo: {"studentName":"Ana","amount":"1500"}'
                rules={[{ validator: jsonValidator }]}
                {...labelColFullWidth}
              >
                <CustomIceEditor
                  mode="json"
                  minLines={6}
                  maxLines={12}
                  placeholder={'{"key":"value"}'}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Entidad Relacionada'}
                name={'RELATED_ENTITY'}
                tooltip="Modulo o tabla con la que quieres vincular esta notificación."
                labelCol={{ xs: 14 }}
              >
                <CustomInput placeholder={'Tabla o modulo relacionado'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...compactBreakpoints}>
              <CustomFormItem
                label={'Identificador relacionado'}
                name={'RELATED_ID'}
                tooltip="Id del registro asociado, si aplica."
                labelCol={{ span: 24 }}
              >
                <CustomInput placeholder={'ID de referencia'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Programar envío'}
                name={'SCHEDULED_AT'}
                tooltip="Si lo dejas vacío, el sistema podrá procesarla apenas corresponda."
                labelCol={{ span: 12 }}
              >
                <CustomDatePicker showTime />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Estado'}
                name={'STATUS'}
                tooltip="Controla si queda pendiente, programada, enviada o fallida."
              >
                <CustomSelect
                  options={notificationStatusOptions}
                  placeholder={'Seleccionar estado'}
                />
              </CustomFormItem>
            </CustomCol>

            <CustomFormItem
              hidden
              label={'Estado del registro'}
              name={'STATE'}
              initialValue={'A'}
            >
              <CustomSelect
                options={[
                  { label: 'Activo', value: 'A' },
                  { label: 'Inactivo', value: 'I' },
                ]}
                placeholder={'Seleccionar estado'}
              />
            </CustomFormItem>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default NotificationForm
