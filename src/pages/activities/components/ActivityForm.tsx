import React, { useEffect, useState } from 'react'
import { Form } from 'antd'
import CustomModal from 'src/components/custom/CustomModal'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomTextarea from 'src/components/custom/CustomTextArea'
import CustomDatePicker from 'src/components/custom/CustomDatePicker'
import CustomInputNumber from 'src/components/custom/CustomInputNumber'
import CustomSelect from 'src/components/custom/CustomSelect'
import { Activity, ActivityPayload } from 'src/services/activities/activity.types'

export type ActivityFormValues = ActivityPayload & { ACTIVITY_ID?: number }

const statusOptions = [
  { label: 'Planificada', value: 'planned' },
  { label: 'Completada', value: 'completed' },
  { label: 'Cancelada', value: 'cancelled' },
]

interface ActivityFormProps {
  open: boolean
  editing?: Activity
  onClose: () => void
  onSubmit: (values: ActivityFormValues) => Promise<void>
}

const ActivityForm: React.FC<ActivityFormProps> = ({
  open,
  editing,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm<ActivityFormValues>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && editing) {
      form.setFieldsValue({
        ...editing,
      })
    }
    if (open && !editing) {
      form.resetFields()
    }
  }, [open, editing, form])

  const handleOk = async () => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      await onSubmit(values)
      form.resetFields()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <CustomModal
      open={open}
      title={editing ? 'Editar actividad' : 'Nueva actividad'}
      onCancel={onClose}
      onOk={handleOk}
      okText={editing ? 'Guardar cambios' : 'Crear'}
      confirmLoading={loading}
      width={720}
    >
      <Form form={form} layout="vertical">
        <CustomRow gutter={[12, 12]}>
          <CustomCol span={12}>
            <CustomFormItem
              label="Título"
              name="TITLE"
              rules={[{ required: true, message: 'Ingresa el título' }]}
            >
              <CustomInput placeholder="Jornada de voluntariado" />
            </CustomFormItem>
          </CustomCol>
          <CustomCol span={12}>
            <CustomFormItem label="Lugar" name="LOCATION">
              <CustomInput placeholder="Campus / Dirección" />
            </CustomFormItem>
          </CustomCol>
          <CustomCol span={12}>
            <CustomFormItem
              label="Fecha inicio"
              name="START_AT"
              rules={[{ required: true, message: 'Indica inicio' }]}
            >
              <CustomDatePicker showTime style={{ width: '100%' }} />
            </CustomFormItem>
          </CustomCol>
          <CustomCol span={12}>
            <CustomFormItem label="Fecha fin" name="END_AT">
              <CustomDatePicker showTime style={{ width: '100%' }} />
            </CustomFormItem>
          </CustomCol>
          <CustomCol span={8}>
            <CustomFormItem
              label="Horas"
              name="HOURS"
              rules={[{ required: true, message: 'Indica horas' }]}
            >
              <CustomInputNumber min={0} max={200} style={{ width: '100%' }} />
            </CustomFormItem>
          </CustomCol>
          <CustomCol span={8}>
            <CustomFormItem label="Cupo" name="CAPACITY">
              <CustomInputNumber min={1} style={{ width: '100%' }} />
            </CustomFormItem>
          </CustomCol>
          <CustomCol span={8}>
            <CustomFormItem label="Estado" name="STATUS" initialValue={'planned'}>
              <CustomSelect options={statusOptions} />
            </CustomFormItem>
          </CustomCol>
          <CustomCol span={24}>
            <CustomFormItem label="Descripción" name="DESCRIPTION">
              <CustomTextarea rows={3} placeholder="Detalles, requerimientos, etc." />
            </CustomFormItem>
          </CustomCol>
        </CustomRow>
      </Form>
    </CustomModal>
  )
}

export default ActivityForm
