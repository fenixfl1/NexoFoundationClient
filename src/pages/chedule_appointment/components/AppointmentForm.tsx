import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import {
  defaultBreakpoints,
  formItemLayout,
  labelColFullWidth,
} from 'src/config/breakpoints'
import { useAppNotification } from 'src/context/NotificationContext'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDatePicker from 'src/components/custom/CustomDatePicker'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomModal from 'src/components/custom/CustomModal'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTextArea from 'src/components/custom/CustomTextArea'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import useDebounce from 'src/hooks/use-debounce'
import {
  Appointment,
  AppointmentPayload,
} from 'src/services/appointments/appointment.types'
import { useCreateAppointmentMutation } from 'src/services/appointments/useCreateAppointmentMutation'
import { useUpdateAppointmentMutation } from 'src/services/appointments/useUpdateAppointmentMutation'
import { useGetPaginatedPeopleMutation } from 'src/services/people/useGetPaginatedPeopleMutation'
import { useGetRequestPaginationMutation } from 'src/services/requests/useGetRequestPaginationMutation'
import { RequestItem } from 'src/services/requests/request.types'
import { useGetStudentPaginationMutation } from 'src/services/students/useGetStudentPaginationMutation'
import { usePeopleStore } from 'src/store/people.store'
import { useRequestStore } from 'src/store/requests.store'
import { useStudentStore } from 'src/store/students.store'
import { AdvancedCondition } from 'src/types/general'

const appointmentStatusOptions = [
  { label: 'Programada', value: 'scheduled' },
  { label: 'Completada', value: 'completed' },
  { label: 'Cancelada', value: 'cancelled' },
]

interface AppointmentFormProps {
  open?: boolean
  appointment?: Appointment
  initialDate?: dayjs.Dayjs
  onClose?: () => void
  onSuccess?: () => void
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  open,
  appointment,
  initialDate,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<AppointmentPayload>()
  const [errorHandler] = useErrorHandler()
  const notify = useAppNotification()
  const { peopleList } = usePeopleStore()
  const { students } = useStudentStore()
  const { requests } = useRequestStore()
  const [personSearch, setPersonSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [requestSearch, setRequestSearch] = useState('')
  const debouncePerson = useDebounce(personSearch)
  const debounceStudent = useDebounce(studentSearch)
  const debounceRequest = useDebounce(requestSearch)

  const { mutateAsync: createAppointment, isPending: isCreatePending } =
    useCreateAppointmentMutation()
  const { mutateAsync: updateAppointment, isPending: isUpdatePending } =
    useUpdateAppointmentMutation()
  const { mutate: getPeople, isPending: isGetPeoplePending } =
    useGetPaginatedPeopleMutation()
  const { mutate: getStudents, isPending: isGetStudentsPending } =
    useGetStudentPaginationMutation()
  const { mutate: getRequests, isPending: isGetRequestsPending } =
    useGetRequestPaginationMutation()

  useEffect(() => {
    if (appointment && open) {
      form.setFieldsValue({
        ...appointment,
        START_AT: dayjs(appointment.START_AT),
        END_AT: appointment.END_AT ? dayjs(appointment.END_AT) : undefined,
      })
    } else if (open) {
      form.resetFields()
      form.setFieldsValue({
        STATUS: 'scheduled',
        START_AT: initialDate,
      })
    }
  }, [appointment, form, initialDate, open])

  const personOptions = useMemo(
    () =>
      peopleList.map((person) => ({
        value: person.PERSON_ID,
        label: `${person.NAME} ${person.LAST_NAME} - ${person.IDENTITY_DOCUMENT}`,
      })),
    [peopleList]
  )

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student.STUDENT_ID,
        label: `${student.NAME} ${student.LAST_NAME} (${student.UNIVERSITY})`,
      })),
    [students]
  )

  const requestOptions = useMemo(
    () =>
      requests.map((request) => ({
        value: request.REQUEST_ID,
        label: `#${request.REQUEST_ID} - ${request.REQUEST_TYPE}`,
      })),
    [requests]
  )

  const fetchPeople = useCallback(() => {
    if (!open) return

    const condition: AdvancedCondition[] = [
      { field: 'STATE', operator: '=', value: 'A' },
    ]

    if (debouncePerson) {
      condition.push({
        field: 'FILTER',
        operator: 'LIKE',
        value: debouncePerson,
      })
    }

    getPeople({ page: 1, size: 20, condition })
  }, [debouncePerson, getPeople, open])

  const fetchStudents = useCallback(() => {
    if (!open) return

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
  }, [debounceStudent, getStudents, open])

  const fetchRequests = useCallback(() => {
    if (!open) return

    const condition: AdvancedCondition[] = []

    if (debounceRequest) {
      condition.push({
        field: 'FILTER',
        operator: 'LIKE',
        value: debounceRequest,
      })
    }

    getRequests({ page: 1, size: 20, condition })
  }, [debounceRequest, getRequests, open])

  useEffect(fetchPeople, [fetchPeople])
  useEffect(fetchStudents, [fetchStudents])
  useEffect(fetchRequests, [fetchRequests])

  const handlePersonChange = (personId?: number) => {
    if (!personId) {
      form.setFieldsValue({ PERSON_ID: undefined, STUDENT_ID: undefined })
      return
    }

    form.setFieldsValue({ PERSON_ID: personId })

    const linkedStudent = students.find(
      (student) => student.PERSON_ID === Number(personId)
    )

    if (linkedStudent) {
      form.setFieldsValue({ STUDENT_ID: linkedStudent.STUDENT_ID })
    }
  }

  const handleStudentChange = (studentId?: number) => {
    form.setFieldsValue({ STUDENT_ID: studentId })

    const student = students.find(
      (item) => item.STUDENT_ID === Number(studentId)
    )

    if (student?.PERSON_ID) {
      form.setFieldsValue({ PERSON_ID: student.PERSON_ID })
    }
  }

  const handleRequestChange = (requestId?: number) => {
    form.setFieldsValue({ REQUEST_ID: requestId })

    const request = requests.find(
      (item: RequestItem) => item.REQUEST_ID === Number(requestId)
    )

    if (request?.PERSON_ID) {
      form.setFieldsValue({
        PERSON_ID: request.PERSON_ID,
        STUDENT_ID: request.STUDENT_ID ?? undefined,
      })
    }
  }

  const handleFinish = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        START_AT: (values.START_AT as Dayjs)?.toISOString(),
        END_AT: values.END_AT ? (values.END_AT as Dayjs).toISOString() : null,
      }

      if (appointment?.APPOINTMENT_ID) {
        await updateAppointment({
          ...payload,
          APPOINTMENT_ID: appointment.APPOINTMENT_ID,
        } as Appointment)
        notify({
          message: 'Operacion exitosa',
          description: 'Cita actualizada correctamente.',
        })
      } else {
        await createAppointment(payload)
        notify({
          message: 'Operacion exitosa',
          description: 'Cita registrada correctamente.',
        })
      }

      form.resetFields()
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
      width="45%"
      title={appointment ? 'Editar cita' : 'Nueva cita'}
    >
      <CustomSpin
        spinning={
          isCreatePending ||
          isUpdatePending ||
          isGetPeoplePending ||
          isGetStudentsPending ||
          isGetRequestsPending
        }
      >
        <CustomDivider />
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow justify="start" gutter={[16, 8]}>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label="Persona"
                name="PERSON_ID"
                rules={[{ required: true }]}
                labelCol={{ span: 8 }}
              >
                <CustomSelect
                  placeholder="Seleccionar persona"
                  showSearch
                  filterOption={false}
                  options={personOptions}
                  onSearch={setPersonSearch}
                  onChange={handlePersonChange}
                  allowClear
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label="Becario"
                name="STUDENT_ID"
                labelCol={{ span: 8 }}
              >
                <CustomSelect
                  placeholder="Seleccionar becario"
                  showSearch
                  filterOption={false}
                  options={studentOptions}
                  onSearch={setStudentSearch}
                  onChange={handleStudentChange}
                  allowClear
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label="Solicitud"
                name="REQUEST_ID"
                labelCol={{ span: 8 }}
              >
                <CustomSelect
                  placeholder="Seleccionar solicitud"
                  showSearch
                  filterOption={false}
                  options={requestOptions}
                  onSearch={setRequestSearch}
                  onChange={handleRequestChange}
                  allowClear
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label="Titulo"
                name="TITLE"
                rules={[{ required: true }]}
                {...labelColFullWidth}
              >
                <CustomInput
                  placeholder="Ej: Seguimiento academico"
                  showCount={false}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label="Descripcion"
                name="DESCRIPTION"
                {...labelColFullWidth}
              >
                <CustomTextArea rows={3} placeholder="Detalle de la cita" />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label="Inicio"
                name="START_AT"
                rules={[{ required: true }]}
              >
                <CustomDatePicker showTime style={{ width: '100%' }} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                {...labelColFullWidth}
                label="Fin"
                name="END_AT"
                dependencies={['START_AT']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startAt = getFieldValue('START_AT')

                      if (!startAt || !value || !dayjs(value).isBefore(dayjs(startAt))) {
                        return Promise.resolve()
                      }

                      return Promise.reject(
                        new Error(
                          'La fecha de fin no puede ser anterior a la fecha de inicio'
                        )
                      )
                    },
                  }),
                ]}
              >
                <CustomDatePicker showTime style={{ width: '100%' }} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem label="Lugar" name="LOCATION">
                <CustomInput placeholder="Ej: Oficina, virtual, etc." />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem label="Estado" name="STATUS">
                <CustomSelect options={appointmentStatusOptions} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label="Notas"
                name="NOTES"
                {...labelColFullWidth}
              >
                <CustomTextArea rows={2} placeholder="Notas adicionales" />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default AppointmentForm
