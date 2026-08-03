import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { App, CollapseProps, DescriptionsProps, Form } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import queryClient from 'src/lib/query-client'
import { getSessionInfo } from 'src/lib/session'
import { useChangePasswordMutation } from 'src/services/users/useChangePasswordMutation'
import { useUpdateUserMutation } from 'src/services/users/useUpdateUserMutation'
import { usePeopleStore } from 'src/store/people.store'
import sleep from 'src/utils/sleep'
import { logDate } from 'src/utils/data-utils'
import { getBase64 } from 'src/utils/base64-helpers'
import { getAvatarLink } from 'src/utils/get-avatar-link'
import formatter from 'src/utils/formatter'
import { ROLE_ADMIN_ID } from 'src/utils/role-path'
import styled from 'styled-components'
import { useGetPersonQuery } from 'src/services/people/useGetPersonQuery'
import { Contact, ContactType } from 'src/services/contact/contact.types'
import { Reference } from 'src/services/people/people.types'
import ChangePasswordForm from './ChangePasswordForm'
import ChangeProfilePicForm from './ChangeProfilePicForm'
import ConditionalComponent from './ConditionalComponent'
import CustomAvatar from './custom/CustomAvatar'
import CustomButton from './custom/CustomButton'
import CustomCard from './custom/CustomCard'
import CustomCol from './custom/CustomCol'
import CustomCollapse from './custom/CustomCollapse'
import CustomDescriptions from './custom/CustomDescription'
import CustomDrawer from './custom/CustomDrawer'
import { customNotification } from './custom/customNotification'
import { CustomText } from './custom/CustomParagraph'
import CustomRow from './custom/CustomRow'
import CustomSpace from './custom/CustomSpace'
import CustomSpin from './custom/CustomSpin'
import CustomTable from './custom/CustomTable'
import CustomTag from './custom/CustomTag'
import CustomTooltip from './custom/CustomTooltip'

const states: Record<string, { label: string; color: string }> = {
  A: { label: 'Activo', color: 'green' },
  I: { label: 'Inactivo', color: 'gray' },
  P: { label: 'Pendiente', color: 'blue' },
}

const AvatarContainer = styled(CustomCard)`
  height: 150px;
  min-height: 150px;
  width: 100% !important;
  background-color: ${({ theme }) => theme.baseBgColor} !important;
  background-image: url('/assets/logo3.png') !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;

  .button-container {
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 10px;
  }
`

const UserProfile: React.FC = () => {
  const { notification } = App.useApp()
  const [errorHandler] = useErrorHandler()
  const [form] = Form.useForm()
  const file = Form.useWatch('AVATAR_FILE', form)
  const [changePasswordModal, setChangePasswordModal] = useState(false)
  const [showChangeProfileOptions, setShowChangeProfileOptions] =
    useState(false)
  const {
    person,
    setPerson,
    profileVisibilityState,
    setProfileVisibilitySate,
  } = usePeopleStore()

  const { mutateAsync: changePassword, isPending: changePasswordIsPending } =
    useChangePasswordMutation()
  const { mutateAsync: updateUser, isPending: isUpdateUserPending } =
    useUpdateUserMutation()

  const [searchParams, setSearchParams] = useSearchParams()

  useGetPersonQuery(searchParams.get('username'))

  const handleModalState = () => {
    setShowChangeProfileOptions(!showChangeProfileOptions)
  }

  const isMyProfile = Number(getSessionInfo().userId) === person.USER_ID
  const isAdmin = String(getSessionInfo().roleId) === ROLE_ADMIN_ID
  const canManagePassword = Boolean(person.USER_ID && (isMyProfile || isAdmin))

  const handleChangePassword = async () => {
    try {
      const data = await form.validateFields()

      delete data.CONFIRM_PASSWORD

      if (isMyProfile) {
        await changePassword(data)
      } else {
        delete data.OLD_PASSWORD

        await updateUser({
          USER_ID: person.USER_ID,
          USERNAME: person.USERNAME,
          PASSWORD: data.NEW_PASSWORD,
        })
      }

      notification.success({
        type: 'success',
        message: isMyProfile
          ? 'Contrasena actualizada'
          : 'Credenciales actualizadas',
        description: isMyProfile
          ? 'Tu contrasena ha sido actualizada con exito.'
          : 'La nueva contrasena fue asignada correctamente.',
      })
      form.resetFields()
      setChangePasswordModal(false)
    } catch (error) {
      errorHandler(error)
    }
  }

  const handleUpdateUser = useCallback(async () => {
    try {
      const data = await form.validateFields()
      if (!Object.keys(data).length) return

      let url = data.AVATAR_URL

      if (file) {
        const uploadedFile = Array.isArray(file)
          ? file[0]
          : Array.isArray(file?.fileList)
            ? file.fileList[0]
            : file

        url = await getBase64(uploadedFile)
      }

      delete data.AVATAR_URL
      delete data.AVATAR_FILE
      delete data.PREFIX

      data.AVATAR = url
      await updateUser(data)

      queryClient.invalidateQueries({ queryKey: ['get-person'] })

      sessionStorage.setItem('avatar', url)
      form.resetFields()
      customNotification({
        message: 'Operacion exitosa',
        description: 'Foto de perfil actualizada con exito.',
      })
      setShowChangeProfileOptions(false)
    } catch (error) {
      errorHandler(error)
    }
  }, [errorHandler, file, form, updateUser])

  const personalInfoItems: DescriptionsProps['items'] = [
    {
      key: 'CREATED_AT',
      label: 'Fecha de registro',
      children: logDate(person.CREATED_AT),
      span: 2,
    },
    {
      key: 'user_id',
      label: 'Codigo',
      children: person.PERSON_ID,
    },
    {
      key: 'STATE',
      label: 'Estado',
      children: (
        <CustomTag color={states[person.STATE]?.color}>
          {states[person.STATE]?.label}
        </CustomTag>
      ),
    },
    {
      key: 'username',
      label: 'Usuario',
      children: `@${person.USERNAME}`,
    },
    {
      key: 'IDENTITY_DOCUMENT',
      label: 'Doc. Identidad',
      children: formatter({
        value: person.IDENTITY_DOCUMENT,
        format: 'document',
      }),
    },
    {
      key: 'PASSWORD',
      label: canManagePassword ? 'Contrasena' : '',
      children: canManagePassword ? (
        <CustomSpace direction={'horizontal'} size={2}>
          <span>**********</span>
          <CustomTooltip
            title={
              isMyProfile
                ? 'Cambiar contrasena'
                : 'Asignar nueva contrasena'
            }
            placement={'right'}
          >
            <CustomButton
              type={'link'}
              icon={<EditOutlined />}
              onClick={() => setChangePasswordModal(true)}
            />
          </CustomTooltip>
        </CustomSpace>
      ) : (
        ' '
      ),
    },
    {
      key: 'EMAIL',
      label: 'Correo electronico',
      children: person.EMAIL,
    },
    {
      key: 'FIRST_NAME',
      label: 'Nombre',
      children: person.NAME,
    },
    {
      key: 'LAST_NAME',
      label: 'Apellido',
      children: person.LAST_NAME,
    },
    {
      key: 'PHONE',
      label: 'Telefono',
      children: formatter({
        value: person.PHONE?.replace(/\D/g, ''),
        format: 'phone',
      }),
    },
    {
      key: 'BIRTHDAY',
      label: 'Fecha de nacimiento',
      children: logDate(person.BIRTH_DATE),
    },
    {
      key: 'GENDER',
      label: 'Genero',
      children: person.GENDER === 'M' ? 'Masculino' : 'Femenino',
    },
    {
      key: 'ADDRESS',
      label: 'Direccion',
      children: person.ADDRESS,
      span: 2,
    },
    {
      key: 'ROLES',
      label: 'Rol',
      children: person.ROLE_NAME ? <CustomTag>{person.ROLE_NAME}</CustomTag> : 'N/A',
    },
  ]

  const contactColumns: ColumnsType<Contact> = [
    {
      dataIndex: 'CONTACT_ID',
      key: 'CONTACT_ID',
      title: 'Codigo',
      align: 'center',
      width: '7%',
    },
    {
      dataIndex: 'TYPE',
      key: 'TYPE',
      title: 'Tipo',
      render: (value: string) => <CustomTag>{value.toUpperCase()}</CustomTag>,
    },
    {
      dataIndex: 'VALUE',
      key: 'RELATIONSHIP',
      title: 'Valor',
      render: (value, record) =>
        record.TYPE === ContactType.PHONE
          ? formatter({ value, format: 'phone' })
          : value,
    },
    {
      dataIndex: 'IS_PRIMARY',
      key: 'IS_PRIMARY',
      title: 'Principal',
      align: 'center',
      width: '7%',
      render: (value) =>
        value ? <CheckOutlined /> : <CloseOutlined color="red" />,
    },
  ]

  const referencesColumns: ColumnsType<Reference> = [
    {
      dataIndex: 'REFERENCE_ID',
      key: 'REFERENCE_ID',
      title: 'Codigo',
      width: '7%',
      align: 'center',
    },
    {
      dataIndex: 'FULL_NAME',
      key: 'FULL_NAME',
      title: 'Nombre',
    },
    {
      dataIndex: 'RELATIONSHIP',
      key: 'RELATIONSHIP',
      title: 'Relacion',
    },
    {
      dataIndex: 'PHONE',
      key: 'PHONE',
      title: 'Telefono',
      render: (value) => formatter({ value, format: 'phone' }),
    },
    {
      dataIndex: 'EMAIL',
      key: 'EMAIL',
      title: 'Correo',
    },
  ]

  const items: CollapseProps['items'] = [
    {
      key: 1,
      label: <CustomText strong>Informacion personal</CustomText>,
      children: <CustomDescriptions column={2} items={personalInfoItems} />,
    },
    {
      key: 2,
      label: <CustomText strong>Contactos</CustomText>,
      children: (
        <ConditionalComponent
          condition={!!person?.CONTACTS?.length}
          fallback={
            <CustomRow justify={'center'} width={'100%'}>
              <CustomText type={'secondary'}>
                No tiene contactos registrados
              </CustomText>
            </CustomRow>
          }
        >
          <CustomTable columns={contactColumns} dataSource={person.CONTACTS} />
        </ConditionalComponent>
      ),
    },
    {
      key: 3,
      label: <CustomText strong>Referencias</CustomText>,
      children: (
        <ConditionalComponent
          condition={!!person?.REFERENCES?.length}
          fallback={
            <CustomRow justify={'center'} width={'100%'}>
              <CustomText type={'secondary'}>
                No tiene contactos de referencias registrados
              </CustomText>
            </CustomRow>
          }
        >
          <CustomTable
            columns={referencesColumns}
            dataSource={person.REFERENCES}
          />
        </ConditionalComponent>
      ),
    },
  ]

  return (
    <>
      <CustomDrawer
        closable={false}
        placement={'right'}
        width={'50%'}
        open={profileVisibilityState}
        onClose={async () => {
          setSearchParams()
          await sleep(500)
          setPerson({} as never)
          setProfileVisibilitySate(false)
        }}
      >
        <CustomSpin spinning={isUpdateUserPending}>
          <CustomRow width={'100%'} gap={10}>
            <AvatarContainer>
              <CustomRow gap={10} justify={'start'} align={'middle'}>
                <CustomAvatar
                  shape={'square'}
                  shadow
                  size={100}
                  src={getAvatarLink(person)}
                />
                <CustomSpace width={'max-content'} size={2}>
                  <CustomText strong color="#000">
                    {person?.NAME} {person?.LAST_NAME}
                  </CustomText>
                  <CustomText type={'secondary'}>
                    @{person?.USERNAME}
                  </CustomText>
                </CustomSpace>
              </CustomRow>
              <ConditionalComponent condition={isMyProfile}>
                <CustomTooltip
                  title={'Cambiar foto de perfil'}
                  placement={'left'}
                >
                  <div className={'button-container'}>
                    <CustomButton
                      size={'middle'}
                      icon={<UploadOutlined />}
                      onClick={handleModalState}
                    />
                  </div>
                </CustomTooltip>
              </ConditionalComponent>
            </AvatarContainer>
            <CustomCol xs={24}>
              <CustomCollapse
                collapsible={'disabled'}
                defaultActiveKey={[1, 2, 3]}
                items={items}
              />
            </CustomCol>
          </CustomRow>
        </CustomSpin>
      </CustomDrawer>

      <ConditionalComponent condition={changePasswordModal}>
        <ChangePasswordForm
          onFinish={handleChangePassword}
          open={changePasswordModal}
          onClose={() => setChangePasswordModal(false)}
          form={form}
          loading={changePasswordIsPending || isUpdateUserPending}
          requireCurrentPassword={isMyProfile}
          title={
            isMyProfile
              ? 'Cambiar contrasena'
              : `Asignar contrasena a @${person.USERNAME}`
          }
          submitLabel={
            isMyProfile ? 'Cambiar contrasena' : 'Guardar nueva contrasena'
          }
          username={person.USERNAME}
        />
      </ConditionalComponent>

      <ConditionalComponent condition={showChangeProfileOptions}>
        <ChangeProfilePicForm
          open={showChangeProfileOptions}
          onClose={handleModalState}
          onFinish={handleUpdateUser}
          form={form}
        />
      </ConditionalComponent>
    </>
  )
}

export default UserProfile
