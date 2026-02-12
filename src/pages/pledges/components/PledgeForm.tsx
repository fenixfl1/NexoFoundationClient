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
import { Pledge } from 'src/services/pledges/pledge.types'
import { useCreatePledgeMutation } from 'src/services/pledges/useCreatePledgeMutation'
import { useUpdatePledgeMutation } from 'src/services/pledges/useUpdatePledgeMutation'
import { useAppNotification } from 'src/context/NotificationContext'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useGetSponsorPaginationMutation } from 'src/services/sponsors/useGetSponsorPaginationMutation'
import { useSponsorStore } from 'src/store/sponsor.store'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import dayjs, { Dayjs } from 'dayjs'
import { pledgeFrequencyOptions, pledgeStatusOptions } from '../constants'

type PledgeFormValues = Omit<Pledge, 'START_DATE' | 'END_DATE'> & {
  START_DATE: Dayjs
  END_DATE?: Dayjs | null
}

interface PledgeFormProps {
  open?: boolean
  pledge?: Pledge
  onClose?: () => void
  onSuccess?: () => void
}

const PledgeForm: React.FC<PledgeFormProps> = ({
  open,
  pledge,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<PledgeFormValues>()
  const notify = useAppNotification()
  const [errorHandler] = useErrorHandler()
  const { sponsors } = useSponsorStore()
  const [sponsorSearch, setSponsorSearch] = useState('')
  const debounceSponsor = useDebounce(sponsorSearch)

  const { mutateAsync: createPledge, isPending: isCreatePending } =
    useCreatePledgeMutation()
  const { mutateAsync: updatePledge, isPending: isUpdatePending } =
    useUpdatePledgeMutation()
  const { mutate: getSponsors, isPending: isGetSponsorsPending } =
    useGetSponsorPaginationMutation()

  useEffect(() => {
    if (pledge && open) {
      form.setFieldsValue({
        ...pledge,
        START_DATE: dayjs(pledge.START_DATE),
        END_DATE: pledge.END_DATE ? dayjs(pledge.END_DATE) : null,
      })
    } else if (open) {
      form.resetFields()
      form.setFieldValue('STATUS', 'P')
      form.setFieldValue('STATE', 'A')
    }
  }, [pledge, open])

  const sponsorOptions = useMemo(
    () =>
      sponsors.map((item) => ({
        value: item.SPONSOR_ID,
        label: `${item.NAME}${item.TAX_ID ? ` · ${item.TAX_ID}` : ''}`,
      })),
    [sponsors]
  )

  const fetchSponsors = useCallback(() => {
    if (!open) return
    const condition: AdvancedCondition[] = [
      { field: 'STATE', operator: '=', value: 'A' },
    ]

    if (debounceSponsor) {
      condition.push({
        field: 'FILTER',
        operator: 'LIKE',
        value: debounceSponsor,
      })
    }

    getSponsors({ page: 1, size: 20, condition })
  }, [open, debounceSponsor, getSponsors])

  useEffect(fetchSponsors, [fetchSponsors])

  const handleFinish = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        START_DATE: values.START_DATE.toISOString(),
        END_DATE: values.END_DATE ? values.END_DATE.toISOString() : null,
      }

      if (pledge?.PLEDGE_ID) {
        await updatePledge({
          ...payload,
          PLEDGE_ID: pledge.PLEDGE_ID,
        } as Pledge)
        notify({
          message: 'Operación exitosa',
          description: 'Compromiso actualizado correctamente.',
        })
      } else {
        await createPledge(payload)
        notify({
          message: 'Operación exitosa',
          description: 'Compromiso registrado correctamente.',
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
      title={pledge ? 'Editar compromiso' : 'Registrar compromiso'}
    >
      <CustomSpin
        spinning={isCreatePending || isUpdatePending || isGetSponsorsPending}
      >
        <CustomDivider />
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Patrocinador'}
                name={'SPONSOR_ID'}
                rules={[{ required: true }]}
              >
                <CustomSelect
                  placeholder={'Seleccionar patrocinador'}
                  showSearch
                  filterOption={false}
                  options={sponsorOptions}
                  onSearch={setSponsorSearch}
                  allowClear
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Nombre'}
                name={'NAME'}
                rules={[{ required: true }]}
              >
                <CustomInput placeholder={'Ej: Compromiso 2025'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Descripción'}
                name={'DESCRIPTION'}
                {...labelColFullWidth}
              >
                <CustomTextArea rows={2} placeholder={'Descripción'} />
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
                  format={{ format: 'currency', currency: 'RD' }}
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
              <CustomFormItem label={'Frecuencia'} name={'FREQUENCY'}>
                <CustomSelect
                  placeholder={'Seleccionar frecuencia'}
                  options={pledgeFrequencyOptions}
                />
              </CustomFormItem>
            </CustomCol>

            <CustomFormItem hidden label={'Estado'} name={'STATUS'}>
              <CustomSelect options={pledgeStatusOptions} />
            </CustomFormItem>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Notas'}
                name={'NOTES'}
                {...labelColFullWidth}
              >
                <CustomTextArea rows={2} placeholder={'Notas'} />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default PledgeForm
