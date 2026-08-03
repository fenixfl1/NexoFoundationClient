import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import type { UploadFile } from 'antd/lib/upload/interface'
import CustomModal from 'src/components/custom/CustomModal'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomTextArea from 'src/components/custom/CustomTextArea'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomDatePicker from 'src/components/custom/CustomDatePicker'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomUpload from 'src/components/custom/CustomUpload'
import {
  formItemLayout,
  defaultBreakpoints,
  labelColFullWidth,
} from 'src/config/breakpoints'
import {
  StudentDocument,
  StudentDocumentPayload,
} from 'src/services/student-documents/student-document.types'
import { useCreateStudentDocumentMutation } from 'src/services/student-documents/useCreateStudentDocumentMutation'
import { useUpdateStudentDocumentMutation } from 'src/services/student-documents/useUpdateStudentDocumentMutation'
import { useGetStudentDocumentQuery } from 'src/services/student-documents/useGetStudentDocumentQuery'
import { useAppNotification } from 'src/context/NotificationContext'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useGetStudentPaginationMutation } from 'src/services/students/useGetStudentPaginationMutation'
import { useStudentStore } from 'src/store/students.store'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import dayjs, { Dayjs } from 'dayjs'
import { getBase64 } from 'src/utils/base64-helpers'
import { useRequirementStore } from 'src/store/requirement.store'
import { useGetRequirementPaginationMutation } from 'src/services/requirements/useGetRequirementPaginationMutation'
import { getSessionInfo } from 'src/lib/session'
import { ROLE_STUDENT_ID } from 'src/utils/role-path'

type DocumentFormValues = Omit<StudentDocumentPayload, 'SIGNED_AT'> & {
  SIGNED_AT?: Dayjs | null
  FILE_UPLOAD?: UploadFile[]
  SIGNED_UPLOAD?: UploadFile[]
}

interface StudentDocumentFormProps {
  open?: boolean
  document?: StudentDocument
  onClose?: () => void
  onSuccess?: () => void
}

const StudentDocumentForm: React.FC<StudentDocumentFormProps> = ({
  open,
  document,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<DocumentFormValues>()
  const notify = useAppNotification()
  const [errorHandler] = useErrorHandler()
  const { students } = useStudentStore()
  const { requirements } = useRequirementStore()
  const { roleId } = getSessionInfo()
  const isStudentRole = String(roleId) === ROLE_STUDENT_ID
  const [studentSearch, setStudentSearch] = useState('')
  const debounceStudent = useDebounce(studentSearch)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [signedFileList, setSignedFileList] = useState<UploadFile[]>([])
  const [requirementSearch, setRequirementSearch] = useState('')
  const debounceRequirement = useDebounce(requirementSearch)

  const { mutateAsync: createDocument, isPending: isCreatePending } =
    useCreateStudentDocumentMutation()
  const { mutateAsync: updateDocument, isPending: isUpdatePending } =
    useUpdateStudentDocumentMutation()
  const { mutate: getStudents, isPending: isGetStudentsPending } =
    useGetStudentPaginationMutation()
  const { mutate: getRequirements, isPending: isGetRequirementsPending } =
    useGetRequirementPaginationMutation()
  const { data: documentDetail, isFetching: isDetailLoading } =
    useGetStudentDocumentQuery(document?.DOCUMENT_ID, open)

  useEffect(() => {
    if (documentDetail && open) {
      form.setFieldsValue({
        ...documentDetail,
        SIGNED_AT: documentDetail.SIGNED_AT
          ? dayjs(documentDetail.SIGNED_AT)
          : undefined,
      })
      setFileList([
        {
          uid: String(documentDetail.DOCUMENT_ID),
          name: documentDetail.FILE_NAME,
          status: 'done',
        },
      ])
      form.setFieldsValue({
        FILE_UPLOAD: [
          {
            uid: String(documentDetail.DOCUMENT_ID),
            name: documentDetail.FILE_NAME,
            status: 'done',
          },
        ],
      })
      if (documentDetail.SIGNED_BASE64) {
        setSignedFileList([
          {
            uid: `signed-${documentDetail.DOCUMENT_ID}`,
            name: `firmado-${documentDetail.FILE_NAME}`,
            status: 'done',
          },
        ])
        form.setFieldsValue({
          SIGNED_UPLOAD: [
            {
              uid: `signed-${documentDetail.DOCUMENT_ID}`,
              name: `firmado-${documentDetail.FILE_NAME}`,
              status: 'done',
            },
          ],
        })
      }
      return
    }

    if (open && !document) {
      form.resetFields()
      setFileList([])
      setSignedFileList([])
      form.setFieldsValue({ STATE: 'A', SIGNED_BASE64: '' })
    }
  }, [documentDetail, open, document])

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student.STUDENT_ID,
        label: `${student.NAME} ${student.LAST_NAME} (${student.UNIVERSITY})`,
      })),
    [students]
  )

  const requirementOptions = useMemo(() => {
    const options = requirements.map((requirement) => ({
      value: requirement.NAME,
      label: requirement.NAME,
    }))

    if (
      documentDetail?.DOCUMENT_TYPE &&
      !options.some((option) => option.value === documentDetail.DOCUMENT_TYPE)
    ) {
      options.unshift({
        value: documentDetail.DOCUMENT_TYPE,
        label: documentDetail.DOCUMENT_TYPE,
      })
    }

    return options
  }, [requirements, documentDetail?.DOCUMENT_TYPE])

  const fetchStudents = useCallback(() => {
    if (!open || isStudentRole) return
    const condition: AdvancedCondition[] = [
      { field: 'STATE', operator: '=', value: 'A' },
    ]

    if (debounceStudent) {
      condition.push({
        field: 'FILTER',
        operator: 'LIKE',
        value: debounceStudent,
      })
    }

    getStudents({ page: 1, size: 20, condition })
  }, [open, debounceStudent, getStudents, isStudentRole])

  useEffect(fetchStudents, [fetchStudents])

  const fetchRequirements = useCallback(() => {
    if (!open) return
    const condition: AdvancedCondition[] = [
      { field: 'STATE', operator: '=', value: 'A' },
    ]

    if (debounceRequirement) {
      condition.push({
        field: ['REQUIREMENT_KEY', 'NAME', 'DESCRIPTION'],
        operator: 'LIKE',
        value: debounceRequirement,
      })
    }

    getRequirements({ page: 1, size: 200, condition })
  }, [open, debounceRequirement, getRequirements])

  useEffect(fetchRequirements, [fetchRequirements])

  const handleUploadFile = async (file: UploadFile) => {
    try {
      const base64 = await getBase64<string>(file)
      form.setFieldsValue({
        FILE_BASE64: base64,
        FILE_NAME: file.name,
        MIME_TYPE: file.type || 'application/pdf',
        FILE_UPLOAD: [file],
      })

      setFileList([file])
      return true
    } catch (error) {
      errorHandler(error)
      return false
    }
  }

  const handleUploadSignedFile = async (file: UploadFile) => {
    const base64 = await getBase64<string>(file)
    form.setFieldsValue({
      SIGNED_BASE64: base64,
      SIGNED_AT: dayjs(),
      SIGNED_UPLOAD: [file],
    })
    setSignedFileList([file])
    return true
  }

  const handleFinish = async () => {
    try {
      const values = await form.validateFields()
      const {
        FILE_UPLOAD: _FILE_UPLOAD,
        SIGNED_UPLOAD: _SIGNED_UPLOAD,
        ...rest
      } = values

      const signedBase64 =
        typeof rest.SIGNED_BASE64 === 'string' ? rest.SIGNED_BASE64 : ''
      const payload = {
        ...rest,
        SIGNED_BASE64: signedBase64,
        SIGNED_AT: values.SIGNED_AT ? values.SIGNED_AT.toISOString() : null,
      }

      if (isStudentRole) {
        delete payload.STUDENT_ID
      }

      if (documentDetail?.DOCUMENT_ID) {
        await updateDocument({
          ...payload,
          DOCUMENT_ID: documentDetail.DOCUMENT_ID,
        } as StudentDocument)
        notify({
          message: 'Operacion exitosa',
          description: 'Documento actualizado correctamente.',
        })
      } else {
        await createDocument(payload)
        notify({
          message: 'Operacion exitosa',
          description: 'Documento registrado correctamente.',
        })
      }

      form.resetFields()
      setFileList([])
      setSignedFileList([])
      onSuccess?.()
      onClose?.()
    } catch (error) {
      errorHandler(error)
    }
  }

  return (
    <CustomModal
      open={open}
      onCancel={onClose}
      onOk={handleFinish}
      width={'50%'}
      title={document ? 'Editar documento' : 'Nuevo documento'}
    >
      <CustomSpin
        spinning={
          isCreatePending ||
          isUpdatePending ||
          isGetStudentsPending ||
          isGetRequirementsPending ||
          isDetailLoading
        }
      >
        <CustomDivider />
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow gutter={[16, 8]}>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Becario'}
                name={'STUDENT_ID'}
                rules={isStudentRole ? [] : [{ required: true }]}
                hidden={isStudentRole}
              >
                <CustomSelect
                  placeholder={'Seleccionar becario'}
                  showSearch
                  filterOption={false}
                  options={studentOptions}
                  onSearch={setStudentSearch}
                  allowClear
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Tipo documento'}
                name={'DOCUMENT_TYPE'}
                rules={[{ required: true }]}
              >
                <CustomSelect
                  placeholder={'Seleccionar requisito'}
                  showSearch
                  filterOption={false}
                  options={requirementOptions}
                  onSearch={setRequirementSearch}
                  allowClear
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Descripcion'}
                name={'DESCRIPTION'}
                {...labelColFullWidth}
              >
                <CustomTextArea
                  rows={2}
                  placeholder={'Descripcion del documento'}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem label={'Fecha de firma'} name={'SIGNED_AT'}>
                <CustomDatePicker showTime style={{ width: '100%' }} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints} />
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Documento (PDF)'}
                name={'FILE_UPLOAD'}
                rules={[{ required: true, message: 'Adjunta el documento.' }]}
                labelCol={{ span: 8 }}
              >
                <CustomUpload
                  accept="application/pdf"
                  listType="text"
                  multiple={false}
                  fileList={fileList}
                  onUpload={handleUploadFile}
                  onRemove={() => {
                    setFileList([])
                    form.setFieldsValue({
                      FILE_BASE64: '',
                      FILE_NAME: '',
                      MIME_TYPE: '',
                      FILE_UPLOAD: [],
                    })
                  }}
                  label="Seleccionar archivo"
                />
              </CustomFormItem>
              <CustomFormItem name={'FILE_BASE64'} hidden>
                <CustomInput />
              </CustomFormItem>
              <CustomFormItem name={'FILE_NAME'} hidden>
                <CustomInput />
              </CustomFormItem>
              <CustomFormItem name={'MIME_TYPE'} hidden>
                <CustomInput />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Documento firmado'}
                name={'SIGNED_UPLOAD'}
                labelCol={{ span: 8 }}
              >
                <CustomUpload
                  accept="application/pdf"
                  listType="text"
                  multiple={false}
                  fileList={signedFileList}
                  onUpload={handleUploadSignedFile}
                  onRemove={() => {
                    setSignedFileList([])
                    form.setFieldsValue({
                      SIGNED_BASE64: '',
                      SIGNED_AT: null,
                      SIGNED_UPLOAD: [],
                    })
                  }}
                  label="Cargar firmado"
                />
              </CustomFormItem>
              <CustomFormItem name={'SIGNED_BASE64'} hidden>
                <CustomInput />
              </CustomFormItem>
            </CustomCol>

            <CustomFormItem
              label={'Estado'}
              hidden
              name={'STATE'}
              initialValue={'A'}
            >
              <CustomSelect
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

export default StudentDocumentForm

