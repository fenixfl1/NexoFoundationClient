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
import { formItemLayout, defaultBreakpoints } from 'src/config/breakpoints'
import { ScholarshipCost } from 'src/services/scholarship-costs/scholarship-cost.types'
import { useCreateScholarshipCostMutation } from 'src/services/scholarship-costs/useCreateScholarshipCostMutation'
import { useUpdateScholarshipCostMutation } from 'src/services/scholarship-costs/useUpdateScholarshipCostMutation'
import { useAppNotification } from 'src/context/NotificationContext'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useGetScholarshipPaginationMutation } from 'src/services/scholarships/useGetScholarshipPaginationMutation'
import { useScholarshipStore } from 'src/store/scholarship.store'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import dayjs, { Dayjs } from 'dayjs'
import {
  periodTypeOptions,
  scholarshipCostStatusOptions,
} from '../constants'

type CostFormValues = Omit<
  ScholarshipCost,
  'PERIOD_START' | 'PERIOD_END'
> & {
  PERIOD_START: Dayjs
  PERIOD_END: Dayjs
}

interface ScholarshipCostFormProps {
  open?: boolean
  cost?: ScholarshipCost
  onClose?: () => void
  onSuccess?: () => void
}

const ScholarshipCostForm: React.FC<ScholarshipCostFormProps> = ({
  open,
  cost,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<CostFormValues>()
  const notify = useAppNotification()
  const [errorHandler] = useErrorHandler()
  const { scholarships } = useScholarshipStore()
  const [scholarshipSearch, setScholarshipSearch] = useState('')
  const debounceScholarship = useDebounce(scholarshipSearch)

  const { mutateAsync: createCost, isPending: isCreatePending } =
    useCreateScholarshipCostMutation()
  const { mutateAsync: updateCost, isPending: isUpdatePending } =
    useUpdateScholarshipCostMutation()
  const { mutate: getScholarships, isPending: isGetScholarshipsPending } =
    useGetScholarshipPaginationMutation()

  useEffect(() => {
    if (cost && open) {
      form.setFieldsValue({
        ...cost,
        PERIOD_START: dayjs(cost.PERIOD_START),
        PERIOD_END: dayjs(cost.PERIOD_END),
      })
    } else if (open) {
      form.resetFields()
      form.setFieldValue('STATUS', 'P')
      form.setFieldValue('STATE', 'A')
      form.setFieldValue('PERIOD_TYPE', 'S')
    }
  }, [cost, open])

  const scholarshipOptions = useMemo(
    () =>
      scholarships.map((item) => ({
        value: item.SCHOLARSHIP_ID,
        label: `${item.NAME} - ${item.STUDENT_NAME ?? ''} ${
          item.STUDENT_LAST_NAME ?? ''
        }`,
      })),
    [scholarships]
  )

  const fetchScholarships = useCallback(() => {
    if (!open) return

    const condition: AdvancedCondition[] = [
      { field: 'STATE', operator: '=', value: 'A' },
    ]

    if (debounceScholarship) {
      condition.push({
        field: 'FILTER',
        operator: 'LIKE',
        value: debounceScholarship,
      })
    }

    getScholarships({ page: 1, size: 20, condition })
  }, [open, debounceScholarship, getScholarships])

  useEffect(fetchScholarships, [fetchScholarships])

  const handleFinish = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        PERIOD_START: values.PERIOD_START.toISOString(),
        PERIOD_END: values.PERIOD_END.toISOString(),
      }

      if (cost?.COST_ID) {
        await updateCost({
          ...payload,
          COST_ID: cost.COST_ID,
        } as ScholarshipCost)
        notify({
          message: 'Operacion exitosa',
          description: 'Costo actualizado correctamente.',
        })
      } else {
        await createCost(payload)
        notify({
          message: 'Operacion exitosa',
          description: 'Costo registrado correctamente.',
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
      title={cost ? 'Editar costo' : 'Registrar costo'}
    >
      <CustomSpin
        spinning={isCreatePending || isUpdatePending || isGetScholarshipsPending}
      >
        <CustomDivider />
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow gutter={[16, 8]}>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Beca'}
                name={'SCHOLARSHIP_ID'}
                rules={[{ required: true }]}
              >
                <CustomSelect
                  placeholder={'Seleccionar beca'}
                  showSearch
                  filterOption={false}
                  options={scholarshipOptions}
                  onSearch={setScholarshipSearch}
                  allowClear
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Periodo'}
                name={'PERIOD_TYPE'}
                rules={[{ required: true }]}
              >
                <CustomSelect options={periodTypeOptions} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Etiqueta'}
                name={'PERIOD_LABEL'}
                rules={[{ required: true }]}
              >
                <CustomInput placeholder={'Ej: 2025-1'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Inicio'}
                name={'PERIOD_START'}
                rules={[{ required: true }]}
              >
                <CustomDatePicker style={{ width: '100%' }} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Fin'}
                name={'PERIOD_END'}
                rules={[{ required: true }]}
              >
                <CustomDatePicker style={{ width: '100%' }} />
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
              <CustomFormItem label={'Estado'} name={'STATUS'}>
                <CustomSelect options={scholarshipCostStatusOptions} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem label={'Notas'} name={'NOTES'}>
                <CustomTextArea rows={2} placeholder={'Notas'} />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default ScholarshipCostForm
