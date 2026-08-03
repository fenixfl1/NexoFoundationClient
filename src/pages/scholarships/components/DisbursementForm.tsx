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
import { Disbursement } from 'src/services/disbursements/disbursement.types'
import { useCreateDisbursementMutation } from 'src/services/disbursements/useCreateDisbursementMutation'
import { useUpdateDisbursementMutation } from 'src/services/disbursements/useUpdateDisbursementMutation'
import { useAppNotification } from 'src/context/NotificationContext'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useGetScholarshipPaginationMutation } from 'src/services/scholarships/useGetScholarshipPaginationMutation'
import { useScholarshipStore } from 'src/store/scholarship.store'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import dayjs, { Dayjs } from 'dayjs'
import { disbursementStatusOptions } from '../constants'

type DisbursementFormValues = Omit<
  Disbursement,
  'DISBURSEMENT_DATE'
> & {
  DISBURSEMENT_DATE: Dayjs
}

interface DisbursementFormProps {
  open?: boolean
  disbursement?: Disbursement
  onClose?: () => void
  onSuccess?: () => void
}

const DisbursementForm: React.FC<DisbursementFormProps> = ({
  open,
  disbursement,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<DisbursementFormValues>()
  const notify = useAppNotification()
  const [errorHandler] = useErrorHandler()
  const { scholarships } = useScholarshipStore()
  const [scholarshipSearch, setScholarshipSearch] = useState('')
  const debounceScholarship = useDebounce(scholarshipSearch)

  const { mutateAsync: createDisbursement, isPending: isCreatePending } =
    useCreateDisbursementMutation()
  const { mutateAsync: updateDisbursement, isPending: isUpdatePending } =
    useUpdateDisbursementMutation()
  const { mutate: getScholarships, isPending: isGetScholarshipsPending } =
    useGetScholarshipPaginationMutation()

  useEffect(() => {
    if (disbursement && open) {
      form.setFieldsValue({
        ...disbursement,
        DISBURSEMENT_DATE: dayjs(disbursement.DISBURSEMENT_DATE),
      })
    } else if (open) {
      form.resetFields()
      form.setFieldValue('STATUS', 'P')
      form.setFieldValue('STATE', 'A')
    }
  }, [disbursement, open])

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
        DISBURSEMENT_DATE: values.DISBURSEMENT_DATE.toISOString(),
      }

      if (disbursement?.DISBURSEMENT_ID) {
        await updateDisbursement({
          ...payload,
          DISBURSEMENT_ID: disbursement.DISBURSEMENT_ID,
        } as Disbursement)
        notify({
          message: 'Operacion exitosa',
          description: 'Desembolso actualizado correctamente.',
        })
      } else {
        await createDisbursement(payload)
        notify({
          message: 'Operacion exitosa',
          description: 'Desembolso registrado correctamente.',
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
      title={disbursement ? 'Editar desembolso' : 'Registrar desembolso'}
    >
      <CustomSpin
        spinning={
          isCreatePending || isUpdatePending || isGetScholarshipsPending
        }
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
                label={'Fecha'}
                name={'DISBURSEMENT_DATE'}
                rules={[{ required: true }]}
              >
                <CustomDatePicker style={{ width: '100%' }} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem label={'Metodo'} name={'METHOD'}>
                <CustomInput placeholder={'Transferencia, cheque...'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem label={'Referencia'} name={'REFERENCE'}>
                <CustomInput placeholder={'Referencia o comprobante'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem label={'Estado'} name={'STATUS'}>
                <CustomSelect options={disbursementStatusOptions} />
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

export default DisbursementForm
