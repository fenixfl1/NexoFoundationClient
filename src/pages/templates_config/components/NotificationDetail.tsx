import React, { useMemo } from 'react'
import CustomAlert from 'src/components/custom/CustomAlert'
import CustomDescriptions from 'src/components/custom/CustomDescription'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomDrawer from 'src/components/custom/CustomDrawer'
import CustomIceEditor from 'src/components/custom/CustomIceEditor'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTag from 'src/components/custom/CustomTag'
import { useGetNotificationQuery } from 'src/services/notifications/useGetNotificationQuery'
import formatter from 'src/utils/formatter'
import { notificationChannelOptions, notificationStatusOptions } from '../constants'

interface NotificationDetailProps {
  notificationId?: number
  open?: boolean
  onClose?: () => void
}

const NotificationDetail: React.FC<NotificationDetailProps> = ({
  notificationId,
  open,
  onClose,
}) => {
  const { data, error, isFetching } = useGetNotificationQuery(notificationId, open)

  const statusOption = notificationStatusOptions.find(
    (item) => item.value === data?.STATUS
  )
  const channelOption = notificationChannelOptions.find(
    (item) => item.value === data?.CHANNEL
  )

  const payloadValue = useMemo(
    () => JSON.stringify(data?.PAYLOAD ?? {}, null, 2),
    [data?.PAYLOAD]
  )

  return (
    <CustomDrawer
      width={'50%'}
      open={open}
      onClose={onClose}
      title={`Detalle de notificacion #${notificationId ?? ''}`}
    >
      <CustomSpin spinning={isFetching}>
        {error ? (
          <CustomAlert
            type="error"
            showIcon
            message="No se pudieron cargar los datos de la notificacion."
          />
        ) : null}

        <CustomDescriptions
          size="small"
          column={1}
          items={[
            {
              key: 'recipient',
              label: 'Destinatario',
              children: data?.RECIPIENT,
            },
            {
              key: 'channel',
              label: 'Canal',
              children: channelOption?.label ?? data?.CHANNEL,
            },
            {
              key: 'status',
              label: 'Estado',
              children: statusOption ? (
                <CustomTag color={statusOption.color as never}>
                  {statusOption.label}
                </CustomTag>
              ) : (
                data?.STATUS
              ),
            },
            {
              key: 'template',
              label: 'Plantilla',
              children: data?.TEMPLATE_NAME
                ? `${data.TEMPLATE_NAME} (${data.TEMPLATE_KEY})`
                : 'Manual',
            },
            {
              key: 'subject',
              label: 'Asunto',
              children: data?.SUBJECT || 'Sin asunto',
            },
            {
              key: 'relatedEntity',
              label: 'Entidad relacionada',
              children: data?.RELATED_ENTITY || 'No definida',
            },
            {
              key: 'relatedId',
              label: 'Identificador relacionado',
              children: data?.RELATED_ID || 'No definido',
            },
            {
              key: 'scheduled',
              label: 'Programada para',
              children: data?.SCHEDULED_AT
                ? formatter({ value: data.SCHEDULED_AT, format: 'datetime' })
                : 'No programada',
            },
            {
              key: 'sentAt',
              label: 'Enviada',
              children: data?.SENT_AT
                ? formatter({ value: data.SENT_AT, format: 'datetime' })
                : 'Pendiente',
            },
          ]}
        />

        {data?.ERROR_MESSAGE ? (
          <>
            <CustomDivider>Ultimo error</CustomDivider>
            <CustomAlert type="error" message={data.ERROR_MESSAGE} showIcon />
          </>
        ) : (
          <>
            <CustomDivider>Estado del envio</CustomDivider>
            <CustomAlert
              type="success"
              showIcon
              message="Esta notificacion no registra errores guardados."
            />
          </>
        )}

        <CustomDivider>Contenido generado</CustomDivider>
        <CustomIceEditor
          mode="html"
          minLines={8}
          maxLines={16}
          value={data?.BODY ?? ''}
          readOnly
        />

        <CustomDivider>Payload</CustomDivider>
        <CustomIceEditor
          mode="json"
          minLines={8}
          maxLines={16}
          value={payloadValue}
          readOnly
        />
      </CustomSpin>
    </CustomDrawer>
  )
}

export default NotificationDetail
