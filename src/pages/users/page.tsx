import { Form } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ConditionalComponent from 'src/components/ConditionalComponent'
import SearchBar from 'src/components/SearchBar'
import CustomCard from 'src/components/custom/CustomCard'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomSpin from 'src/components/custom/CustomSpin'
import { useCustomNotifications } from 'src/hooks/use-custom-notification'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import useDebounce from 'src/hooks/use-debounce'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useGetUserPaginationMutation } from 'src/services/users/useGetUserPaginationMutation'
import { User } from 'src/services/users/users.types'
import { useUpdateUserMutation } from 'src/services/users/useUpdateUserMutation'
import { useUserStore } from 'src/store/user.store'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import UserList from './components/UserList'
import UserForm from './components/UserForm'

const initialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const UserPage: React.FC = () => {
  const [errorHandler] = useErrorHandler()
  const { confirmModal } = useCustomModal()
  const { successNotification } = useCustomNotifications()
  const [form] = Form.useForm()
  const [selectedUser, setSelectedUser] = useState<User>()
  const [userModalState, setUserModalState] = useState<boolean>()
  const [searchKey, setSearchKey] = useState<string>('')
  const debounce = useDebounce(searchKey)

  const { metadata } = useUserStore()

  const { mutate: getUserPagination, isPending: isGetUserPending } =
    useGetUserPaginationMutation()
  const { mutateAsync: updateUser, isPending: isUpdatePending } =
    useUpdateUserMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      if (userModalState) return

      const { FILTER = initialFilter.FILTER } = form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          field: 'FILTER',
          operator: 'LIKE',
        })
      }

      getUserPagination({ page, size, condition })
    },
    [
      debounce,
      form,
      getUserPagination,
      metadata.currentPage,
      metadata.pageSize,
      userModalState,
    ]
  )

  useEffect(handleSearch, [handleSearch])

  const toggleModalState = () => {
    setUserModalState(!userModalState)
    if (userModalState) {
      setSelectedUser(undefined)
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setUserModalState(true)
  }

  const handleToggleState = async (user: User) => {
    confirmModal({
      title: 'Confirmacion',
      content: `Seguro que desea ${
        user.STATE === 'A' ? 'inhabilitar' : 'habilitar'
      } este usuario?`,
      onOk: async () => {
        try {
          await updateUser({
            USER_ID: user.USER_ID,
            USERNAME: user.USERNAME,
            STATE: user.STATE === 'A' ? 'I' : 'A',
          })

          successNotification({
            message: 'Operacion exitosa',
            description: 'El estado del usuario fue actualizado exitosamente.',
          })

          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const filterContent = useMemo(
    () => (
      <CustomRow>
        <CustomCol xs={24}>
          <CustomFormItem
            label={'Estado'}
            name={['FILTER', 'STATE__IN']}
            labelCol={{ span: 24 }}
          >
            <CustomSelect
              mode={'multiple'}
              placeholder={'Seleccionar estado'}
              options={[
                { value: 'A', label: 'Activos' },
                { value: 'I', label: 'Inactivos' },
              ]}
            />
          </CustomFormItem>
        </CustomCol>
      </CustomRow>
    ),
    []
  )

  return (
    <>
      <CustomSpin spinning={isGetUserPending || isUpdatePending}>
        <CustomCard style={{ padding: 15 }}>
          <SearchBar
            form={form}
            createText={'Nuevo usuario'}
            searchPlaceholder={'Buscar usuarios...'}
            onSearch={setSearchKey}
            onCreate={toggleModalState}
            filterContent={filterContent}
            initialValue={initialFilter}
            onFilter={() => handleSearch()}
          />

          <UserList onEdit={handleEdit} onToggleState={handleToggleState} />
        </CustomCard>
      </CustomSpin>
      <ConditionalComponent condition={userModalState}>
        <UserForm
          user={selectedUser}
          open={userModalState}
          onClose={toggleModalState}
        />
      </ConditionalComponent>
    </>
  )
}

export default UserPage
