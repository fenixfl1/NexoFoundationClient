import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import CustomCol from 'src/components/custom/CustomCol'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomModal from 'src/components/custom/CustomModal'
import CustomPasswordInput from 'src/components/custom/CustomPasswordInput'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomSpin from 'src/components/custom/CustomSpin'
import {
  defaultBreakpoints,
  formItemLayout,
  labelColFullWidth,
} from 'src/config/breakpoints'
import { useAppNotification } from 'src/context/NotificationContext'
import useDebounce from 'src/hooks/use-debounce'
import { Person } from 'src/services/people/people.types'
import { useGetPaginatedPeopleMutation } from 'src/services/people/useGetPaginatedPeopleMutation'
import { useGetRolePaginationMutation } from 'src/services/roles/useGetRolePaginationMutation'
import { Role } from 'src/services/roles/role.type'
import { useCreateUserMutation } from 'src/services/users/useCreateUserMutation'
import { useUpdateUserMutation } from 'src/services/users/useUpdateUserMutation'
import { User } from 'src/services/users/users.types'
import { usePeopleStore } from 'src/store/people.store'
import { useRoleStore } from 'src/store/role.store'
import { AdvancedCondition } from 'src/types/general'
import { useErrorHandler } from 'src/hooks/use-error-handler'

interface UserFormProps {
  user?: User
  open?: boolean
  onClose?: () => void
}

const UserForm: React.FC<UserFormProps> = ({ user, open, onClose }) => {
  const notification = useAppNotification()
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [searchRoleKey, setSearchRoleKey] = useState('')
  const debounce = useDebounce(searchKey)
  const debounceRole = useDebounce(searchRoleKey)
  const isEditing = Boolean(user?.USER_ID)

  const [errorHandler] = useErrorHandler()

  const { peopleList } = usePeopleStore()
  const { roleList } = useRoleStore()

  const { mutateAsync: createUser, isPending: isCreateUserPending } =
    useCreateUserMutation()
  const { mutateAsync: updateUser, isPending: isUpdateUserPending } =
    useUpdateUserMutation()
  const { mutate: getPeoplePagination, isPending: isGetPeoplePending } =
    useGetPaginatedPeopleMutation()
  const { mutate: getRoles, isPending: isGetRolesPending } =
    useGetRolePaginationMutation()

  const selectedRoleId = useMemo(() => {
    if (user?.ROLE_ID) {
      return user.ROLE_ID
    }

    const roleName = user?.ROLES?.split(',')[0]?.trim()
    return roleList.find((item) => item.NAME === roleName)?.ROLE_ID
  }, [roleList, user?.ROLE_ID, user?.ROLES])

  const personOptions = useMemo(() => {
    const options = peopleList.map((item) => ({
      label: `${item.NAME} ${item.LAST_NAME ?? ''} - ${
        item.IDENTITY_DOCUMENT
      }`.trim(),
      value: item.PERSON_ID,
    }))

    if (isEditing && user?.PERSON_ID) {
      const currentOption = {
        label: user.FULL_NAME,
        value: user.PERSON_ID,
      }

      if (!options.some((item) => item.value === currentOption.value)) {
        return [currentOption, ...options]
      }
    }

    return options
  }, [isEditing, peopleList, user?.FULL_NAME, user?.PERSON_ID])

  const handleSearchRole = useCallback(() => {
    const condition: AdvancedCondition<Role>[] = [
      {
        value: 'A',
        operator: '=',
        field: 'STATE',
      },
    ]

    if (debounceRole) {
      condition.push({
        value: debounceRole,
        operator: 'LIKE',
        field: 'NAME',
      })
    }

    getRoles({ page: 1, size: 15, condition })
  }, [debounceRole, getRoles])

  const handleSearchPeople = useCallback(() => {
    const condition: AdvancedCondition<Person>[] = [
      {
        value: 'A',
        operator: '=',
        field: 'STATE',
      },
    ]

    if (!isEditing) {
      condition.push({
        value: true,
        operator: 'IS NULL',
        field: 'USER_ID',
      })
    }

    if (debounce) {
      condition.push({
        value: debounce,
        operator: 'LIKE',
        field: ['IDENTITY_DOCUMENT', 'NAME', 'LAST_NAME', 'EMAIL'],
      })
    }

    getPeoplePagination({ page: 1, size: 15, condition })
  }, [debounce, getPeoplePagination, isEditing])

  useEffect(handleSearchPeople, [handleSearchPeople])
  useEffect(handleSearchRole, [handleSearchRole])

  useEffect(() => {
    if (!open) {
      return
    }

    if (isEditing && user) {
      form.setFieldsValue({
        PERSON_ID: user.PERSON_ID,
        USERNAME: user.USERNAME,
        ROLE_ID: selectedRoleId,
        PASSWORD: undefined,
      })
      return
    }

    form.resetFields()
  }, [form, isEditing, open, selectedRoleId, user])

  const handleFinish = async () => {
    try {
      const data = await form.validateFields()

      if (isEditing && user) {
        await updateUser({
          USER_ID: user.USER_ID,
          USERNAME: data.USERNAME,
          ROLE_ID: data.ROLE_ID,
          ...(data.PASSWORD ? { PASSWORD: data.PASSWORD } : {}),
        })

        notification({
          message: 'Operacion exitosa',
          description: 'Usuario actualizado correctamente.',
        })
      } else {
        await createUser(data)
        notification({
          message: 'Operacion exitosa',
          description: 'Usuario creado correctamente.',
        })
      }

      form.resetFields()
      onClose?.()
    } catch (error) {
      errorHandler(error)
    }
  }

  return (
    <CustomModal
      closable
      title={isEditing ? 'Editar usuario' : 'Formulario de usuario'}
      open={open}
      onCancel={onClose}
      onOk={handleFinish}
    >
      <CustomSpin spinning={isCreateUserPending || isUpdateUserPending}>
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Persona'}
                name={'PERSON_ID'}
                rules={[{ required: true }]}
                {...labelColFullWidth}
              >
                <CustomSelect
                  disabled={isEditing}
                  onSearch={setSearchKey}
                  loading={isGetPeoplePending}
                  placeholder={'Seleccionar persona'}
                  options={personOptions}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Usuario'}
                name={'USERNAME'}
                noSpaces
                rules={[{ required: true }]}
              >
                <CustomInput placeholder={'Nombre de usuario'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol {...defaultBreakpoints}>
              <CustomFormItem
                label={'Rol'}
                name={'ROLE_ID'}
                rules={[{ required: true }]}
              >
                <CustomSelect
                  onSearch={setSearchRoleKey}
                  loading={isGetRolesPending}
                  placeholder={'Seleccionar rol'}
                  options={roleList.map((item) => ({
                    label: item.NAME,
                    value: item.ROLE_ID,
                  }))}
                />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={isEditing ? 'Nueva contrasena' : 'Contrasena'}
                name={'PASSWORD'}
                rules={
                  isEditing
                    ? [
                        {
                          min: 6,
                          message:
                            'La contrasena debe tener al menos 6 caracteres.',
                        },
                      ]
                    : [
                        { required: true },
                        {
                          min: 6,
                          message:
                            'La contrasena debe tener al menos 6 caracteres.',
                        },
                      ]
                }
                {...labelColFullWidth}
              >
                <CustomPasswordInput
                  placeholder={
                    isEditing
                      ? 'Dejar en blanco para mantener la actual'
                      : 'Crear contrasena'
                  }
                />
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default UserForm
