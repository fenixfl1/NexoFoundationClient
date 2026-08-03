import { Form } from 'antd'
import { Dayjs } from 'dayjs'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import CatalogSelector from 'src/components/CatalogSelector'
import ConditionalComponent from 'src/components/ConditionalComponent'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDatePicker from 'src/components/custom/CustomDatePicker'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomModal from 'src/components/custom/CustomModal'
import CustomPersonSelector from 'src/components/custom/CustomPersonSelector'
import { CustomTitle } from 'src/components/custom/CustomParagraph'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTextArea from 'src/components/custom/CustomTextArea'
import {
  defaultBreakpoints,
  formItemLayout,
  labelColFullWidth,
} from 'src/config/breakpoints'
import { useAppNotification } from 'src/context/NotificationContext'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import useDebounce from 'src/hooks/use-debounce'
import { getSessionInfo } from 'src/lib/session'
import {
  CreateRequestPayload,
  RequestItem,
  RequestStatus,
} from 'src/services/requests/request.types'
import { useCreateRequestMutation } from 'src/services/requests/useCreateRequestMutation'
import { useUpdateRequestMutation } from 'src/services/requests/useUpdateRequestMutation'
import { useGetStudentPaginationMutation } from 'src/services/students/useGetStudentPaginationMutation'
import { useStudentStore } from 'src/store/students.store'
import { AdvancedCondition } from 'src/types/general'
import { ROLE_STUDENT_ID } from 'src/utils/role-path'

interface RequestFormProps {
  onCancel?: () => void
  open: boolean
  onSuccess?: () => void
  request?: RequestItem
}

const requestStatusLabels: Record<RequestStatus, string> = {
  P: 'Pendiente',
  R: 'En revision',
  A: 'Aprobada',
  D: 'Rechazada',
  C: 'Cita programada',
}

type RequestFormValues = Omit<CreateRequestPayload, 'NEXT_APPOINTMENT'> & {
  NEXT_APPOINTMENT?: Dayjs | null
}

const RequestForm: React.FC<RequestFormProps> = ({
  onCancel,
  onSuccess,
  open,
  request,
}) => {
  const [form] = Form.useForm<RequestFormValues>()
  const isEditing = Boolean(request?.REQUEST_ID)
  const notification = useAppNotification()
  const [errorHandler] = useErrorHandler()
  const session = getSessionInfo()
  const sessionPersonId = Number(session.personId)
  const isStudent = String(session.roleId) === ROLE_STUDENT_ID

  const [studentSearch, setStudentSearch] = useState('')
  const debounceStudent = useDebounce(studentSearch)

  const { students } = useStudentStore()
  const { mutate: getStudents, isPending: isGetStudentsPending } =
    useGetStudentPaginationMutation()
  const { mutateAsync: createRequest, isPending: isCreateRequestPending } =
    useCreateRequestMutation()
  const { mutateAsync: updateRequest, isPending: isUpdateRequestPending } =
    useUpdateRequestMutation()
  const currentStudentId = Form.useWatch('STUDENT_ID', form)

  const statusOptions = useMemo(
    () =>
      (Object.entries(requestStatusLabels) as [RequestStatus, string][]).map(
        ([value, label]) => ({ value, label })
      ),
    []
  )

  const handleStudentSearch = useCallback(() => {
    const condition: AdvancedCondition[] = [
      {
        value: 'A',
        operator: '=',
        field: 'STATE',
      },
      {
        value: 3,
        operator: '=',
        field: 'ROLE_ID',
      },
    ]

    if (debounceStudent) {
      condition.push({
        value: debounceStudent,
        operator: 'LIKE',
        field: 'FILTER',
      })
    }

    if (isStudent) {
      condition.push({
        value: sessionPersonId,
        field: 'PERSON_ID',
        operator: '=',
      })
    }

    getStudents({ page: 1, size: 20, condition })
  }, [debounceStudent, getStudents, isStudent, sessionPersonId])

  const handleStudentSelect = (studentId?: number) => {
    const student = students.find(
      (item) => item.STUDENT_ID === Number(studentId)
    )

    if (student) {
      form.setFieldsValue({
        PERSON_ID: student.PERSON_ID,
        COHORT: student.COHORT ?? undefined,
      })
    }
  }

  const handlePersonSelect = (personId?: number) => {
    if (!personId) {
      form.setFieldsValue({ STUDENT_ID: undefined })
      return
    }

    const student = students.find((item) => item.PERSON_ID === Number(personId))
    form.setFieldsValue({
      STUDENT_ID: student?.STUDENT_ID,
      COHORT: student?.COHORT ?? undefined,
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (request?.REQUEST_ID) {
        const payload = {
          STATUS: values.STATUS,
          NEXT_APPOINTMENT: values.NEXT_APPOINTMENT
            ? values.NEXT_APPOINTMENT.toISOString()
            : null,
          NOTES: values.NOTES ?? null,
        }

        await updateRequest({ ...payload, REQUEST_ID: request.REQUEST_ID })
        notification({
          message: 'Solicitud actualizada',
          description: 'La solicitud se actualizo correctamente.',
        })
      } else {
        const payload: CreateRequestPayload = {
          ...values,
          PERSON_ID: isStudent ? sessionPersonId : values.PERSON_ID,
          STUDENT_ID: values.STUDENT_ID ?? null,
          STATUS: isStudent ? 'P' : values.STATUS,
          ASSIGNED_COORDINATOR: isStudent
            ? null
            : (values.ASSIGNED_COORDINATOR ?? null),
          NEXT_APPOINTMENT:
            isStudent || !values.NEXT_APPOINTMENT
              ? null
              : values.NEXT_APPOINTMENT.toISOString(),
          COHORT: values.COHORT ?? null,
          NOTES: values.NOTES ?? null,
        }

        await createRequest(payload)
        notification({
          message: 'Solicitud registrada',
          description: 'La solicitud se registro correctamente.',
        })
      }

      form.resetFields()
      setStudentSearch('')
      onCancel?.()
      onSuccess?.()
    } catch (error) {
      errorHandler(error)
    }
  }

  useEffect(() => {
    if (open) {
      handleStudentSearch()
    }
  }, [open, handleStudentSearch])

  useEffect(() => {
    if (!open) {
      form.resetFields()
      setStudentSearch('')
    }
  }, [open, form])

  useEffect(() => {
    if (!open || !request) return

    form.setFieldsValue({
      ...request,
      NEXT_APPOINTMENT: request.NEXT_APPOINTMENT
        ? dayjs(request.NEXT_APPOINTMENT)
        : null,
    })
  }, [form, open, request])

  useEffect(() => {
    if (!open || isEditing || !isStudent) return
    form.setFieldsValue({
      PERSON_ID: sessionPersonId,
      STATUS: 'P',
      NEXT_APPOINTMENT: null,
    })
  }, [form, isEditing, isStudent, open, sessionPersonId])

  useEffect(() => {
    if (!open || isEditing || !isStudent) return

    const currentStudentId = form.getFieldValue('STUDENT_ID')
    if (currentStudentId) return

    const student = students.find(
      (item) => item.PERSON_ID === sessionPersonId
    )

    if (student?.STUDENT_ID) {
      form.setFieldsValue({
        STUDENT_ID: student.STUDENT_ID,
        COHORT: student.COHORT ?? undefined,
      })
    }
  }, [form, isEditing, isStudent, open, sessionPersonId, students])

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        label: `${student.NAME} ${student.LAST_NAME} - ${student.UNIVERSITY}`,
        value: student.STUDENT_ID,
      })),
    [students]
  )
  const selectedStudent = useMemo(
    () =>
      students.find((student) => student.STUDENT_ID === Number(currentStudentId)),
    [currentStudentId, students]
  )

  const showStudentOnlyRestrictedFields = !isStudent || isEditing
  const showAdminCreateFields = !isEditing && !isStudent

  return (
    <CustomModal
      onCancel={onCancel}
      open={open}
      width={'50%'}
      onOk={handleSubmit}
      okText={request ? 'Actualizar solicitud' : 'Guardar solicitud'}
      okButtonProps={{
        loading: isCreateRequestPending || isUpdateRequestPending,
      }}
    >
      <CustomSpin spinning={isCreateRequestPending || isUpdateRequestPending}>
        <CustomDivider>
          <CustomTitle level={5}>
            {request ? 'Editar solicitud' : 'Nueva Solicitud'}
          </CustomTitle>
        </CustomDivider>
        <CustomForm
          form={form}
          {...formItemLayout}
          initialValues={{ STATUS: 'P', COHORT: selectedStudent?.COHORT }}
        >
          <CustomRow justify={'start'}>
            <ConditionalComponent condition={showAdminCreateFields}>
              <CustomCol {...defaultBreakpoints}>
                <CustomFormItem
                  label={'Solicitante'}
                  name={'PERSON_ID'}
                  rules={[{ required: true }]}
                >
                  <CustomPersonSelector
                    placeholder={'Seleccionar persona'}
                    onChange={handlePersonSelect}
                  />
                </CustomFormItem>
              </CustomCol>
            </ConditionalComponent>

            <CustomFormItem hidden name={'PERSON_ID'} />

            <ConditionalComponent condition={showAdminCreateFields}>
              <CustomCol {...defaultBreakpoints}>
                <CustomFormItem
                  label={'Becario (opcional)'}
                  name={'STUDENT_ID'}
                >
                  <CustomSelect
                    placeholder={'Vincular becario existente'}
                    options={studentOptions}
                    loading={isGetStudentsPending}
                    onSearch={setStudentSearch}
                    onChange={handleStudentSelect}
                    allowClear
                  />
                </CustomFormItem>
              </CustomCol>
            </ConditionalComponent>

            <CustomFormItem hidden name={'STUDENT_ID'} />
            <CustomFormItem hidden name={'COHORT'} />

            <ConditionalComponent condition={!isEditing}>
              <CustomCol {...defaultBreakpoints}>
                <CustomFormItem
                  label={'Tipo de solicitud'}
                  name={'REQUEST_TYPE'}
                  rules={[{ required: true }]}
                >
                  <CatalogSelector
                    catalog={'ID_LIST_REQUEST_TYPES'}
                    placeholder={'Seleccionar tipo'}
                  />
                </CustomFormItem>
              </CustomCol>
            </ConditionalComponent>

            <ConditionalComponent condition={!isStudent || isEditing}>
              <CustomCol {...defaultBreakpoints}>
                <CustomFormItem label={'Estado'} name={'STATUS'}>
                  <CustomSelect options={statusOptions} />
                </CustomFormItem>
              </CustomCol>
            </ConditionalComponent>

            <ConditionalComponent condition={showAdminCreateFields}>
              <CustomCol {...defaultBreakpoints}>
                <CustomFormItem
                  label={'Coordinador'}
                  name={'ASSIGNED_COORDINATOR'}
                >
                  <CustomInput placeholder={'Nombre del coordinador'} />
                </CustomFormItem>
              </CustomCol>
            </ConditionalComponent>

            <ConditionalComponent condition={showStudentOnlyRestrictedFields}>
              <CustomCol {...defaultBreakpoints}>
                <CustomFormItem
                  label={'Proxima cita'}
                  name={'NEXT_APPOINTMENT'}
                >
                  <CustomDatePicker minDate={dayjs()} />
                </CustomFormItem>
              </CustomCol>
            </ConditionalComponent>

            <ConditionalComponent condition={showAdminCreateFields}>
              <CustomCol {...defaultBreakpoints}>
                <CustomFormItem label={'Cohorte'} name={'COHORT'}>
                  <CatalogSelector
                    catalog={'ID_LIST_COHORTS'}
                    placeholder={'Seleccionar cohorte'}
                  />
                </CustomFormItem>
              </CustomCol>
            </ConditionalComponent>

            <CustomCol xs={24}>
              <CustomFormItem
                label={'Notas'}
                name={'NOTES'}
                rules={
                  isStudent
                    ? [{ required: true, message: 'Agrega una nota para la solicitud.' }]
                    : undefined
                }
                {...labelColFullWidth}
              >
                <CustomTextArea rows={4} placeholder={'Comentarios'} />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default RequestForm
