import React, { useEffect, useState } from 'react'
import { Form } from 'antd'
import CustomModal from 'src/components/custom/CustomModal'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomInputNumber from 'src/components/custom/CustomInputNumber'
import CustomForm from 'src/components/custom/CustomForm'
import CustomCheckbox from 'src/components/custom/CustomCheckbox'

interface EnrollmentFormProps {
  open: boolean
  title?: string
  studentsOptions: { value: number; label: string }[]
  onSearchStudent: (value: string) => void
  onSubmit: (values: {
    STUDENT_ID: number
    HOURS_EARNED?: number
    COMPLETE_NOW?: boolean
  }) => Promise<void>
  onClose: () => void
}

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({
  open,
  title = 'Inscribir becario',
  studentsOptions,
  onSearchStudent,
  onSubmit,
  onClose,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  const handleOk = async () => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      await onSubmit(values)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <CustomModal
      open={open}
      title={title}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Inscribir"
    >
      <CustomForm form={form} layout="vertical">
        <CustomFormItem
          label="Becario"
          name="STUDENT_ID"
          rules={[{ required: true, message: 'Selecciona el becario' }]}
        >
          <CustomSelect
            showSearch
            filterOption={false}
            options={studentsOptions}
            onSearch={onSearchStudent}
            placeholder="Buscar becario"
          />
        </CustomFormItem>
        <CustomFormItem label="Horas a acreditar" name="HOURS_EARNED">
          <CustomInputNumber min={0} max={200} style={{ width: '100%' }} />
        </CustomFormItem>
        <CustomFormItem name="COMPLETE_NOW" valuePropName="checked">
          <CustomCheckbox>Marcar completado y acreditar horas</CustomCheckbox>
        </CustomFormItem>
      </CustomForm>
    </CustomModal>
  )
}

export default EnrollmentForm
