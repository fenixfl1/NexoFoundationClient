import React, { useEffect, useState } from 'react'
import { Form, UploadFile } from 'antd'
import CustomModal from 'src/components/custom/CustomModal'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomInput from 'src/components/custom/CustomInput'
import CustomTextarea from 'src/components/custom/CustomTextArea'
import CustomInputNumber from 'src/components/custom/CustomInputNumber'
import CustomDivider from 'src/components/custom/CustomDivider'
import { Term, TermPayload } from 'src/services/grades/grades.types'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomForm from 'src/components/custom/CustomForm'
import {
  defaultBreakpoints,
  formItemLayout,
  labelColFullWidth,
} from 'src/config/breakpoints'
import ConditionalComponent from 'src/components/ConditionalComponent'
import CustomCollapseFormList from 'src/components/custom/CustomCollapseFormList'
import CustomDragger from 'src/components/custom/CustomDragger'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import CatalogSelector from 'src/components/CatalogSelector'
import { useGetMultiCatalogList } from 'src/hooks/use-get-multi-catalog-list'

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
  const [errorHandler] = useErrorHandler()
  const [form] = Form.useForm<FormValues>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const courses = Form.useWatch('COURSES', form)

  useGetMultiCatalogList()

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
    try {
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
    } catch (error) {
      errorHandler(error)
    }
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
        initialValues={{ COURSES: [{}] }}
        {...formItemLayout}
      >
        <CustomRow justify={'start'}>
          <ConditionalComponent condition={!isStudentRole}>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label="Becario"
                name="STUDENT_ID"
                hidden={isStudentRole}
                rules={
                  isStudentRole
                    ? []
                    : [{ required: true, message: 'Selecciona el becario' }]
                }
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
          </ConditionalComponent>
          <CustomCol {...defaultBreakpoints}>
            <CustomFormItem
              label="Período"
              name="PERIOD"
              rules={[{ required: true, message: 'Indica el período' }]}
            >
              <CatalogSelector
                catalog={'ID_LIST_COHORTS'}
                placeholder={'Seleccionar cohorte'}
              />
            </CustomFormItem>
          </CustomCol>
          <CustomCol {...defaultBreakpoints}>
            <CustomFormItem label="Observaciones" name="OBSERVATIONS">
              <CustomTextarea placeholder="Notas internas" rows={1} />
            </CustomFormItem>
          </CustomCol>

          <CustomCol xs={24}>
            <CustomFormItem label={' '} colon={false} {...labelColFullWidth}>
              <CustomDivider>Materias</CustomDivider>
              <CustomCollapseFormList
                name={'COURSES'}
                form={form}
                initialValue={[{}]}
                addText={'Agregar materia'}
                addButtonPosition={'bottom'}
                itemLabel={(index) => courses?.[index]?.COURSE_NAME}
              >
                {(field) => (
                  <CustomRow key={field.key} align={'middle'}>
                    <CustomCol {...defaultBreakpoints}>
                      <CustomFormItem
                        {...field}
                        label={'Materia'}
                        name={[field.name, 'COURSE_NAME']}
                        rules={[{ required: true, message: 'Materia' }]}
                        labelCol={{ span: 8 }}
                      >
                        <CustomInput placeholder="Nombre de la materia" />
                      </CustomFormItem>
                    </CustomCol>
                    <CustomCol {...defaultBreakpoints}>
                      <CustomFormItem
                        {...field}
                        name={[field.name, 'GRADE']}
                        label={'Nota'}
                        rules={[{ required: true, message: 'Nota' }]}
                        labelCol={{ span: 8 }}
                      >
                        <CustomInputNumber
                          placeholder={'0 - 100'}
                          min={0}
                          max={100}
                          width={'100%'}
                        />
                      </CustomFormItem>
                    </CustomCol>
                    <CustomCol {...defaultBreakpoints}>
                      <CustomFormItem
                        {...field}
                        name={[field.name, 'CREDITS']}
                        label={'Créditos'}
                        rules={[{ required: true, message: 'Créditos' }]}
                        labelCol={{ span: 8 }}
                      >
                        <CustomInputNumber
                          placeholder={'0 - 20'}
                          min={0}
                          max={20}
                          width={'100%'}
                        />
                      </CustomFormItem>
                    </CustomCol>
                    <CustomCol {...defaultBreakpoints}>
                      <CustomFormItem
                        {...field}
                        label={'Estado'}
                        name={[field.name, 'STATUS']}
                        initialValue="in_progress"
                        labelCol={{ span: 8 }}
                      >
                        <CustomSelect
                          options={courseStatusOptions}
                          placeholder="Estado"
                        />
                      </CustomFormItem>
                    </CustomCol>
                  </CustomRow>
                )}
              </CustomCollapseFormList>
            </CustomFormItem>
          </CustomCol>

          <CustomCol xs={24}>
            <CustomFormItem label={' '} colon={false} {...labelColFullWidth}>
              <CustomDivider>Captura de calificaciones</CustomDivider>
              <CustomFormItem noStyle rules={[{ required: true }]}>
                <CustomDragger
                  name="file"
                  accept={'.pdf,image/*'}
                  fileList={fileList}
                  onChange={({ fileList: next }) => {
                    setFileList(next.slice(-1))
                  }}
                />
              </CustomFormItem>
            </CustomFormItem>
          </CustomCol>
        </CustomRow>
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
