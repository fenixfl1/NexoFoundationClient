import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import CustomModal from 'src/components/custom/CustomModal'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomTextArea from 'src/components/custom/CustomTextArea'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomDatePicker from 'src/components/custom/CustomDatePicker'
import CustomInputNumber from 'src/components/custom/CustomInputNumber'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomSpin from 'src/components/custom/CustomSpin'
import {
  formItemLayout,
  defaultBreakpoints,
  labelColFullWidth,
} from 'src/config/breakpoints'
import { Scholarship } from 'src/services/scholarships/scholarship.types'
import { useCreateScholarshipMutation } from 'src/services/scholarships/useCreateScholarshipMutation'
import { useUpdateScholarshipMutation } from 'src/services/scholarships/useUpdateScholarshipMutation'
import { useAppNotification } from 'src/context/NotificationContext'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useGetStudentPaginationMutation } from 'src/services/students/useGetStudentPaginationMutation'
import { useStudentStore } from 'src/store/students.store'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import dayjs, { Dayjs } from 'dayjs'
import { scholarshipStatusOptions, periodTypeOptions } from '../constants'

type ScholarshipFormValues = Omit<Scholarship, 'START_DATE' | 'END_DATE'> & {
  START_DATE: Dayjs
  END_DATE?: Dayjs | null
}

interface ScholarshipFormProps {
  open?: boolean
  scholarship?: Scholarship
  onClose?: () => void
  onSuccess?: () => void
}

const ScholarshipForm: React.FC<ScholarshipFormProps> = ({
  open,
  scholarship,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<ScholarshipFormValues>()
  const notify = useAppNotification()
  const [errorHandler] = useErrorHandler()
  const { students } = useStudentStore()
  const [studentSearch, setStudentSearch] = useState('')
  const debounceStudent = useDebounce(studentSearch)

  const { mutateAsync: createScholarship, isPending: isCreatePending } =
    useCreateScholarshipMutation()
  const { mutateAsync: updateScholarship, isPending: isUpdatePending } =
    useUpdateScholarshipMutation()
  const { mutate: getStudents, isPending: isGetStudentsPending } =
    useGetStudentPaginationMutation()

  useEffect(() => {
    if (scholarship && open) {
      form.setFieldsValue({
        ...scholarship,
        START_DATE: dayjs(scholarship.START_DATE),
        END_DATE: scholarship.END_DATE ? dayjs(scholarship.END_DATE) : null,
      })
    } else if (open) {
      form.resetFields()
      form.setFieldValue('STATUS', 'P')
      form.setFieldValue('STATE', 'A')
      form.setFieldValue('PERIOD_TYPE', 'S')
    }
  }, [scholarship, open])

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student.STUDENT_ID,
        label: `${student.NAME} ${student.LAST_NAME} (${student.UNIVERSITY})`,
      })),
    [students]
  )

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
  }, [open, debounceStudent, getStudents])

  useEffect(fetchStudents, [fetchStudents])

  const handleFinish = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        START_DATE: values.START_DATE.toISOString(),
        END_DATE: values.END_DATE ? values.END_DATE.toISOString() : null,
      }

      if (scholarship?.SCHOLARSHIP_ID) {
        await updateScholarship({
          ...payload,
          SCHOLARSHIP_ID: scholarship.SCHOLARSHIP_ID,
        } as Scholarship)
        notify({
          message: 'Operacion exitosa',
          description: 'Beca actualizada correctamente.',
        })
      } else {
        await createScholarship(payload)
        notify({
          message: 'Operacion exitosa',
          description: 'Beca registrada correctamente.',
        })
      }

      form.resetFields()
      onClose?.()
      onSuccess?.()
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
      title={scholarship ? 'Editar beca' : 'Registrar beca'}
    >
      <CustomSpin
        spinning={isCreatePending || isUpdatePending || isGetStudentsPending}
      >
        <CustomDivider />
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow gutter={[16, 8]} justify={'start'}>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Becario'}
                name={'STUDENT_ID'}
                rules={[{ required: true }]}
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
                label={'Nombre de la beca'}
                name={'NAME'}
                rules={[{ required: true }]}
              >
                <CustomInput placeholder={'Ej: Beca completa 2025'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Descripcion'}
                name={'DESCRIPTION'}
                {...labelColFullWidth}
              >
                <CustomTextArea rows={2} placeholder={'Descripcion'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Monto'}
                name={'AMOUNT'}
                rules={[{ required: true }]}
              >
                <CustomInputNumber
                  min={0}
                  placeholder={'Monto'}
                  style={{ width: '100%' }}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Inicio'}
                name={'START_DATE'}
                rules={[{ required: true }]}
              >
                <CustomDatePicker style={{ width: '100%' }} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem label={'Fin'} name={'END_DATE'}>
                <CustomDatePicker style={{ width: '100%' }} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem label={'Estado'} name={'STATUS'}>
                <CustomSelect options={scholarshipStatusOptions} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem label={'Periodo'} name={'PERIOD_TYPE'}>
                <CustomSelect options={periodTypeOptions} />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default ScholarshipForm
