import { FormInstance } from 'antd'
import React from 'react'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomForm from 'src/components/custom/CustomForm'
import CustomInput from 'src/components/custom/CustomInput'
import CustomMaskedInput from 'src/components/custom/CustomMaskedInput'
import CustomModal from 'src/components/custom/CustomModal'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTextArea from 'src/components/custom/CustomTextArea'
import {
  defaultBreakpoints,
  formItemLayout,
  labelColFullWidth,
} from 'src/config/breakpoints'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useGetCatalog } from 'src/hooks/use-get-catalog'
import { Reference } from 'src/services/people/people.types'
import { normalizeNumbers } from 'src/utils/form-value-normalize'

interface FormValue {
  REFERENCE: Reference
}

interface ReferenceFormProps {
  form: FormInstance<FormValue>
  open: boolean
  onClose?: () => void
  onOk?: () => void
  initialValue?: Reference
  submitting?: boolean
}

const ReferenceForm: React.FC<ReferenceFormProps> = ({
  form,
  open,
  onClose,
  onOk,
  initialValue,
  submitting = false,
}) => {
  const [errorHandler] = useErrorHandler()

  const [relationships] = useGetCatalog('ID_LIST_RELATIONSHIPS')

  const handleCreate = async () => {
    try {
      await form.validateFields()
      onOk?.()
    } catch (error) {
      errorHandler(error)
    }
  }

  React.useEffect(() => {
    if (!open) return

    form.setFieldsValue({
      REFERENCE: initialValue ?? ({} as Reference),
    })
  }, [form, initialValue, open])

  return (
    <CustomModal
      onCancel={onClose}
      onOk={handleCreate}
      open={open}
      title={'Formulario de Referencias'}
      width={'45%'}
    >
      <CustomSpin spinning={submitting}>
        <CustomForm form={form} {...formItemLayout}>
          <CustomFormItem hidden name={['REFERENCE', 'REFERENCE_ID']} />
          <CustomFormItem hidden name={['REFERENCE', 'PERSON_ID']} />
          <CustomRow justify={'start'}>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Nombre'}
                name={['REFERENCE', 'FULL_NAME']}
                rules={[{ required: true }]}
              >
                <CustomInput placeholder={'Nombre completo'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Relación'}
                name={['REFERENCE', 'RELATIONSHIP']}
                rules={[{ required: true }]}
              >
                <CustomSelect
                  placeholder={'Seleccionar Relación'}
                  options={relationships.map((item) => ({
                    label: item.LABEL,
                    value: item.VALUE,
                  }))}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Teléfono'}
                name={['REFERENCE', 'PHONE']}
                rules={[{ required: true }]}
                getValueFromEvent={normalizeNumbers}
              >
                <CustomMaskedInput
                  type={'phone'}
                  placeholder={'Número de Teléfono'}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Correo'}
                name={['REFERENCE', 'EMAIL']}
                rules={[{ type: 'email' }]}
              >
                <CustomInput placeholder={'Correo'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Dirección'}
                name={['REFERENCE', 'ADDRESS']}
                {...labelColFullWidth}
              >
                <CustomTextArea placeholder={'Dirección'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Nota'}
                name={['REFERENCE', 'NOTES']}
                {...labelColFullWidth}
              >
                <CustomTextArea placeholder={'Nota adicional'} />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default ReferenceForm
