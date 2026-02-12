import React, { useEffect, useState } from 'react'
import { Form, UploadFile } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import CustomModal from 'src/components/custom/CustomModal'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomInput from 'src/components/custom/CustomInput'
import CustomTextarea from 'src/components/custom/CustomTextArea'
import CustomInputNumber from 'src/components/custom/CustomInputNumber'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomButton from 'src/components/custom/CustomButton'
import CustomUpload from 'src/components/custom/CustomUpload'
import { Term, TermPayload } from 'src/services/grades/grades.types'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormList from 'src/components/custom/CustomFormList'

export type FormValues = TermPayload & { TERM_ID?: number }

interface TermFormProps {
  open: boolean
  editing?: Term
  isStudentRole: boolean
  studentOptions: { value: number; label: string }[]
  onStudentSearch: (value: string) => void
  onClose: () => void
  onSubmit: (values: FormValues) => Promise<void>
  initialValues?: FormValues
}

const courseStatusOptions = [
  { label: 'En curso', value: 'in_progress', color: 'gold' },
  { label: 'Aprobada', value: 'passed', color: 'green' },
  { label: 'Reprobada', value: 'failed', color: 'red' },
]

const TermForm: React.FC<TermFormProps> = ({
  open,
  editing,
  isStudentRole,
  studentOptions,
  onStudentSearch,
  onClose,
  onSubmit,
  initialValues,
}) => {
  const [form] = Form.useForm<FormValues>()
  const [fileList, setFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue(initialValues)
      if (initialValues.CAPTURE_FILE_NAME) {
        setFileList([
          {
            uid: initialValues.CAPTURE_FILE_NAME,
            name: initialValues.CAPTURE_FILE_NAME,
            status: 'done',
          },
        ])
      }
      return
    }

    if (open && !initialValues) {
      form.resetFields()
      setFileList([])
    }
  }, [open, initialValues, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    const payload: FormValues = { ...values }

    if (fileList[0]?.originFileObj) {
      const file = fileList[0].originFileObj as File
      const base64 = await fileToBase64(file)
      payload.CAPTURE_BASE64 = base64
      payload.CAPTURE_FILE_NAME = file.name
      payload.CAPTURE_MIME_TYPE = file.type
    }

    if (isStudentRole) {
      delete payload.STUDENT_ID
    }

    await onSubmit(payload)
    setFileList([])
    onClose()
  }

  return (
    <CustomModal
      title={editing ? 'Editar cuatrimestre' : 'Nuevo cuatrimestre'}
      open={open}
      width={800}
      onCancel={() => {
        setFileList([])
        onClose()
      }}
      onOk={handleOk}
      okText={editing ? 'Guardar cambios' : 'Guardar'}
    >
      <CustomForm
        form={form}
        layout="vertical"
        initialValues={{ COURSES: [{}] }}
      >
        <CustomRow gutter={[12, 12]}>
          <CustomCol span={8}>
            <CustomFormItem
              label="Becario"
              name="STUDENT_ID"
              rules={
                isStudentRole
                  ? []
                  : [{ required: true, message: 'Selecciona el becario' }]
              }
              hidden={isStudentRole}
            >
              <CustomSelect
                showSearch
                filterOption={false}
                options={studentOptions}
                placeholder="Buscar por nombre o cédula"
                onSearch={onStudentSearch}
                allowClear
              />
            </CustomFormItem>
          </CustomCol>
          <CustomCol span={8}>
            <CustomFormItem
              label="Período (ej. 2026-1)"
              name="PERIOD"
              rules={[{ required: true, message: 'Indica el período' }]}
            >
              <CustomInput placeholder="2026-1" />
            </CustomFormItem>
          </CustomCol>
          <CustomCol span={8}>
            <CustomFormItem label="Observaciones" name="OBSERVATIONS">
              <CustomTextarea placeholder="Notas internas" rows={1} />
            </CustomFormItem>
          </CustomCol>
        </CustomRow>

        <CustomDivider>Materias</CustomDivider>
        <CustomFormList name="COURSES">
          {(fields, { add, remove }) => (
            <CustomSpace
              direction="vertical"
              size={12}
              style={{ width: '100%' }}
            >
              {fields.map((field) => (
                <CustomRow key={field.key} align={'middle'}>
                  <CustomCol span={8}>
                    <CustomFormItem
                      {...field}
                      name={[field.name, 'COURSE_NAME']}
                      rules={[{ required: true, message: 'Materia' }]}
                    >
                      <CustomInput placeholder="Nombre de la materia" />
                    </CustomFormItem>
                  </CustomCol>
                  <CustomCol span={4}>
                    <CustomFormItem
                      {...field}
                      name={[field.name, 'GRADE']}
                      rules={[{ required: true, message: 'Nota' }]}
                    >
                      <CustomInputNumber
                        min={0}
                        max={100}
                        style={{ width: '100%' }}
                      />
                    </CustomFormItem>
                  </CustomCol>
                  <CustomCol span={4}>
                    <CustomFormItem
                      {...field}
                      name={[field.name, 'CREDITS']}
                      rules={[{ required: true, message: 'Créditos' }]}
                    >
                      <CustomInputNumber
                        min={0}
                        max={20}
                        style={{ width: '100%' }}
                      />
                    </CustomFormItem>
                  </CustomCol>
                  <CustomCol span={6}>
                    <CustomFormItem
                      {...field}
                      name={[field.name, 'STATUS']}
                      initialValue="in_progress"
                    >
                      <CustomSelect
                        options={courseStatusOptions}
                        placeholder="Estado"
                      />
                    </CustomFormItem>
                  </CustomCol>

                  <CustomFormItem>
                    <CustomButton
                      danger
                      type="text"
                      onClick={() => remove(field.name)}
                      icon={<DeleteOutlined />}
                    />
                  </CustomFormItem>
                </CustomRow>
              ))}
              <CustomButton
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add()}
              >
                Agregar materia
              </CustomButton>
            </CustomSpace>
          )}
        </CustomFormList>

        <CustomDivider>Captura de calificaciones</CustomDivider>
        <CustomFormItem name="CAPTURE">
          <CustomUpload
            listType="text"
            accept=".pdf,image/*"
            fileList={fileList}
            multiple={false}
            onUpload={async () => true}
            onChange={({ fileList: next }) => {
              setFileList(next.slice(-1))
            }}
          >
            Adjuntar archivo (PDF o imagen)
          </CustomUpload>
        </CustomFormItem>
      </CustomForm>
    </CustomModal>
  )
}

export default TermForm

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
