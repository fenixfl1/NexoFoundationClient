import React, { useEffect } from 'react'
import { Form } from 'antd'
import CustomModal from 'src/components/custom/CustomModal'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomTextArea from 'src/components/custom/CustomTextArea'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomSelect from 'src/components/custom/CustomSelect'
import { formItemLayout } from 'src/config/breakpoints'
import { Requirement } from 'src/services/requirements/requirement.types'
import { useCreateRequirementMutation } from 'src/services/requirements/useCreateRequirementMutation'
import { useUpdateRequirementMutation } from 'src/services/requirements/useUpdateRequirementMutation'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useAppNotification } from 'src/context/NotificationContext'

interface RequirementFormProps {
  open?: boolean
  requirement?: Requirement
  onClose?: () => void
  onSuccess?: () => void
}

type RequirementFormValues = Omit<Requirement, 'IS_REQUIRED'> & {
  IS_REQUIRED: 'true' | 'false'
}

const RequirementForm: React.FC<RequirementFormProps> = ({
  open,
  requirement,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<RequirementFormValues>()
  const [errorHandler] = useErrorHandler()
  const notify = useAppNotification()

  const { mutateAsync: createRequirement, isPending: isCreatePending } =
    useCreateRequirementMutation()
  const { mutateAsync: updateRequirement, isPending: isUpdatePending } =
    useUpdateRequirementMutation()

  useEffect(() => {
    if (requirement && open) {
      form.setFieldsValue({
        ...requirement,
        IS_REQUIRED: requirement.IS_REQUIRED ? 'true' : 'false',
      })
    } else if (open) {
      form.resetFields()
      form.setFieldValue('STATE', 'A')
      form.setFieldValue('IS_REQUIRED', 'true')
    }
  }, [requirement, open])

  const handleFinish = async () => {
    try {
      const data = await form.validateFields()
      const payload = {
        ...data,
        IS_REQUIRED: data.IS_REQUIRED === 'true',
      }

      if (requirement?.REQUIREMENT_ID) {
        await updateRequirement({
          ...payload,
          REQUIREMENT_ID: requirement.REQUIREMENT_ID,
        })
        notify({
          message: 'Operación exitosa',
          description: 'Requisito actualizado correctamente.',
        })
      } else {
        await createRequirement(payload)
        notify({
          message: 'Operación exitosa',
          description: 'Requisito creado correctamente.',
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
      width={'40%'}
      title={requirement ? 'Editar requisito' : 'Registrar requisito'}
    >
      <CustomSpin spinning={isCreatePending || isUpdatePending}>
        <CustomDivider />
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow gutter={[16, 8]}>
            <CustomCol xs={24}>
              <CustomFormItem
                uppercase
                noSpaces
                label={'Clave'}
                name={'REQUIREMENT_KEY'}
                rules={[{ required: true }]}
              >
                <CustomInput placeholder={'Ej: CARTA_ACEPTACION'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Nombre'}
                name={'NAME'}
                rules={[{ required: true }]}
              >
                <CustomInput placeholder={'Nombre del requisito'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem label={'Descripción'} name={'DESCRIPTION'}>
                <CustomTextArea
                  rows={2}
                  placeholder={'Descripción del requisito'}
                  showCount={false}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem label={'Obligatorio'} name={'IS_REQUIRED'}>
                <CustomSelect
                  options={[
                    { label: 'Sí', value: 'true' },
                    { label: 'No', value: 'false' },
                  ]}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem label={'Estado'} name={'STATE'}>
                <CustomSelect
                  placeholder={'Seleccionar estado'}
                  options={[
                    { label: 'Activo', value: 'A' },
                    { label: 'Inactivo', value: 'I' },
                  ]}
                />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default RequirementForm
