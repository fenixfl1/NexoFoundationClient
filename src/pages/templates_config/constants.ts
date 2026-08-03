export const notificationChannelOptions = [
  { value: 'email', label: 'Correo electronico' },
  { value: 'sms', label: 'SMS', disabled: true },
  { value: 'in_app', label: 'In App', disabled: true },
  { value: 'push', label: 'Push', disabled: true },
  { value: 'whatsapp', label: 'WhatsApp', disabled: true },
]

export const notificationTemplateChannelOptions = [
  { value: 'email', label: 'Correo electronico institucional' },
]

export const notificationStatusOptions = [
  { value: 'P', label: 'Pendiente', color: 'gold' },
  { value: 'C', label: 'Programada', color: 'cyan' },
  { value: 'S', label: 'Enviada', color: 'green' },
  { value: 'F', label: 'Fallida', color: 'red' },
]
