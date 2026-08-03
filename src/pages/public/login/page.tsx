import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useForm } from 'antd/es/form/Form'
import React, { useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import CustomButton from 'src/components/custom/CustomButton'
import CustomCard from 'src/components/custom/CustomCard'
import CustomCheckbox from 'src/components/custom/CustomCheckbox'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomForm from 'src/components/custom/CustomForm'
import CustomInput from 'src/components/custom/CustomInput'
import CustomPasswordInput from 'src/components/custom/CustomPasswordInput'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSpin from 'src/components/custom/CustomSpin'
import { PATH_MAIN_LOGO, PATH_RESET_PASSWORD } from 'src/constants/routes'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useAuthenticateUserMutation } from 'src/services/auth/useAuthenticateUserMutation'
import styled from 'styled-components'

const buttonStyle: React.CSSProperties = { width: '100%' }

const ImageContainer = styled.div`
  height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    filter: invert(100%);
  }
`

const CustomLabel = ({ text }: { text: string }) => (
  <span style={{ padding: 0, marginBottom: -10 }}>{text}</span>
)

type LoginForm = {
  username: string
  password: string
  remember: boolean
}

const Login = () => {
  const navigate = useNavigate()
  const [errorHandler] = useErrorHandler()
  const [form] = useForm<LoginForm>()
  const [remember, setRemember] = useState<boolean>()

  const { mutateAsync: authenticateUser, isPaused } =
    useAuthenticateUserMutation()

  const handleFinish = async (values: LoginForm) => {
    try {
      if (values.remember) {
        localStorage.setItem('rememberedUsername', values.username)
      } else {
        localStorage.removeItem('rememberedUsername')
      }

      delete values.remember

      await authenticateUser(values)
    } catch (error) {
      errorHandler(error)
    }
  }

  return (
    <CustomSpin spinning={isPaused}>
      <CustomRow justify={'center'} align={'middle'} width={'100%'}>
        <CustomCol xs={24} sm={18} md={12} xl={8}>
          <CustomCard>
            <CustomRow
              style={{ height: 'inherit' }}
              justify={'center'}
              align={'middle'}
            >
              <CustomForm
                style={{
                  width: '80%',
                  padding: '0 20px',
                }}
                autoComplete={'off'}
                form={form}
                onFinish={handleFinish}
              >
                <ImageContainer>
                  <img width={'100%'} src={PATH_MAIN_LOGO} />
                </ImageContainer>
                <CustomFormItem
                  label={<CustomLabel text="Usuario" />}
                  name="username"
                  rules={[{ required: true }]}
                  labelCol={{ span: 24 }}
                  initialValue={localStorage.getItem('rememberedUsername') || ''}
                >
                  <CustomInput
                    prefix={<UserOutlined />}
                    placeholder={'Nombre de usuario'}
                  />
                </CustomFormItem>
                <CustomFormItem
                  label={<CustomLabel text="Contrasena" />}
                  name="password"
                  rules={[{ required: true }]}
                  labelCol={{ span: 24 }}
                >
                  <CustomPasswordInput prefix={<LockOutlined />} />
                </CustomFormItem>

                <div style={{ margin: '30px 0' }} />
                <CustomCol xs={24}>
                  <CustomRow justify={'space-between'}>
                    <CustomFormItem
                      name="remember"
                      valuePropName="checked"
                      initialValue={!!localStorage.getItem('rememberedUsername')}
                    >
                      <CustomCheckbox
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                      >
                        Recordarme
                      </CustomCheckbox>
                    </CustomFormItem>

                    <CustomFormItem>
                      <CustomButton
                        type={'link'}
                        onClick={() =>
                          navigate(generatePath(PATH_RESET_PASSWORD))
                        }
                      >
                        Olvide mi contrasena
                      </CustomButton>
                    </CustomFormItem>
                  </CustomRow>
                </CustomCol>
                <div style={{ margin: '10px 0' }} />
                <CustomFormItem>
                  <CustomRow justify="center">
                    <CustomButton
                      htmlType="submit"
                      type="primary"
                      style={buttonStyle}
                    >
                      Iniciar sesion
                    </CustomButton>
                  </CustomRow>
                </CustomFormItem>
              </CustomForm>
            </CustomRow>
          </CustomCard>
        </CustomCol>
      </CustomRow>
    </CustomSpin>
  )
}

export default Login
