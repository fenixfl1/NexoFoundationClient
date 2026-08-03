import { SwapOutlined } from '@ant-design/icons'
import { FormInstance } from 'antd'
import React, { useEffect } from 'react'
import { formItemLayout } from 'src/config/breakpoints'
import { getSessionInfo } from 'src/lib/session'
import CustomButton from './custom/CustomButton'
import CustomCol from './custom/CustomCol'
import CustomForm from './custom/CustomForm'
import CustomFormItem from './custom/CustomFormItem'
import CustomModal from './custom/CustomModal'
import CustomPasswordInput from './custom/CustomPasswordInput'
import CustomRow from './custom/CustomRow'
import CustomSpin from './custom/CustomSpin'

interface ChangePasswordFormProps {
  open: boolean
  onClose: () => void
  onFinish: () => void
  loading?: boolean
  form: FormInstance
  requireCurrentPassword?: boolean
  title?: string
  submitLabel?: string
  username?: string
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  form,
  loading,
  onClose,
  onFinish,
  open,
  requireCurrentPassword = true,
  title = 'Cambiar contraseña',
  submitLabel = 'Cambiar contraseña',
  username,
}) => {
  useEffect(() => {
    if (!open) return

    form.setFieldsValue({
      USERNAME: username ?? getSessionInfo().username,
      OLD_PASSWORD: undefined,
      NEW_PASSWORD: undefined,
      CONFIRM_PASSWORD: undefined,
    })
  }, [form, open, username])

  return (
    <CustomModal title={title} open={open} onCancel={onClose} footer={null}>
      <CustomSpin spinning={loading}>
        <CustomForm layout={'vertical'} form={form} {...formItemLayout}>
          <CustomRow justify={'end'}>
            <CustomFormItem hidden noStyle name={'USERNAME'} />
            {requireCurrentPassword ? (
              <CustomCol span={24}>
                <CustomFormItem
                  label="Contraseña actual"
                  name="OLD_PASSWORD"
                  rules={[{ required: true }]}
                >
                  <CustomPasswordInput placeholder={'Contraseña actual'} />
                </CustomFormItem>
              </CustomCol>
            ) : null}
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Nueva contraseña'}
                name={'NEW_PASSWORD'}
                rules={[{ required: true }, { min: 6 }]}
              >
                <CustomPasswordInput placeholder={'Nueva contraseña'} />
              </CustomFormItem>
            </CustomCol>

            <CustomCol xs={24}>
              <CustomFormItem
                label={'Confirmar contraseña'}
                name={'CONFIRM_PASSWORD'}
                dependencies={['NEW_PASSWORD']}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('NEW_PASSWORD') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(
                        new Error(
                          'La nueva contraseña que ingresaste no coincide.'
                        )
                      )
                    },
                  }),
                ]}
              >
                <CustomPasswordInput placeholder={'Confirmar contraseña'} />
              </CustomFormItem>
            </CustomCol>

            <CustomFormItem label={'  '} colon={false}>
              <CustomButton
                icon={<SwapOutlined />}
                type="primary"
                onClick={onFinish}
              >
                {submitLabel}
              </CustomButton>
            </CustomFormItem>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default ChangePasswordForm
