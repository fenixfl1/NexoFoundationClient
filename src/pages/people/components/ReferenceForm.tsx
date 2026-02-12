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
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useParams } from 'react-router-dom'
import { useGetCatalog } from 'src/hooks/use-get-catalog'
import { useCreateReferenceMutation } from 'src/services/people/useCreateReferenceMutation'
import { usePeopleStore } from 'src/store/people.store'
import { Reference } from 'src/services/people/people.types'
import { CustomParagraph } from 'src/components/custom/CustomParagraph'
import { normalizeNumbers } from 'src/utils/form-value-normalize'

interface FormValue {
  REFERENCE: Reference
}

interface ReferenceFormProps {
  form: FormInstance<FormValue>
  open: boolean
  onClose?: () => void
  onOk?: () => void
}

const ReferenceForm: React.FC<ReferenceFormProps> = ({
  form,
  open,
  onClose,
  onOk,
}) => {
  const [errorHandler] = useErrorHandler()
  const { confirmModal } = useCustomModal()

  const { mutateAsync: createReference, isPending: isCreatePending } =
    useCreateReferenceMutation()

  const { person } = usePeopleStore()

  const [relationships] = useGetCatalog('ID_LIST_RELATIONSHIPS')

  const { action } = useParams()

  const isEditing = action === 'edit'

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()

      values.REFERENCE.PHONE = values.REFERENCE.PHONE.replace(/\D/g, '')

      if (isEditing) {
        await createReference(values.REFERENCE)
      }
      onOk?.()
    } catch (error) {
      errorHandler(error)
    }
  }

  const handleClose = () => {
    confirmModal({
      title: 'Confirmación',
      content: 'Seguro que desea cerrar la ventana?',
      onOk: onClose,
    })
  }

  return (
    <CustomModal
      onCancel={handleClose}
      onOk={handleCreate}
      open={open}
      title={'Formulario de Referencias'}
      width={'45%'}
    >
      <CustomSpin spinning={isCreatePending}>
        <CustomForm form={form} {...formItemLayout}>
          <CustomFormItem
            hidden
            name={['REFERENCE', 'PERSON_ID']}
            rules={[{ required: isEditing }]}
            initialValue={person?.PERSON_ID}
          />
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

            <CustomCol xs={24}>
              <CustomFormItem
                hidden
                shouldUpdate
                label={' '}
                colon={false}
                {...labelColFullWidth}
              >
                {() => (
                  <CustomParagraph>
                    <pre>{JSON.stringify(form.getFieldsValue(), null, 2)}</pre>
                  </CustomParagraph>
                )}
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default ReferenceForm
