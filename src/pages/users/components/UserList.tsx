import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { ListProps } from 'antd'
import React from 'react'
import CustomAvatar from 'src/components/custom/CustomAvatar'
import CustomButton from 'src/components/custom/CustomButton'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomList from 'src/components/custom/CustomList'
import CustomListItem from 'src/components/custom/CustomListItem'
import CustomListItemMeta from 'src/components/custom/CustomListItemMeta'
import { CustomLink } from 'src/components/custom/CustomParagraph'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomTag from 'src/components/custom/CustomTag'
import CustomTooltip from 'src/components/custom/CustomTooltip'
import { User } from 'src/services/users/users.types'
import { useUserStore } from 'src/store/user.store'
import { getAvatarLink } from 'src/utils/get-avatar-link'
import { getTablePagination } from 'src/utils/table-pagination'

interface UserListProps {
  dataSource?: User[]
  onEdit?: (user: User) => void
  onView?: (user: User) => void
  onToggleState?: (user: User) => void
}

const UserList: React.FC<UserListProps> = ({
  onEdit,
  onView,
  onToggleState,
}) => {
  const { userList, metadata } = useUserStore()

  const renderItem: ListProps<User>['renderItem'] = (item) => (
    <CustomListItem
      actions={[
        <CustomTooltip title={'Editar'}>
          <CustomButton
            disabled={item.STATE === 'I'}
            type={'link'}
            icon={<EditOutlined />}
            onClick={() => onEdit?.(item)}
          />
        </CustomTooltip>,
        <CustomTooltip
          title={item.STATE === 'A' ? 'Inhabilitar' : 'Habilitar'}
        >
          <CustomButton
            danger={item.STATE === 'A'}
            type={'link'}
            icon={<DeleteOutlined />}
            onClick={() => onToggleState?.(item)}
          />
        </CustomTooltip>,
      ]}
    >
      <CustomListItemMeta
        avatar={<CustomAvatar size={44} src={getAvatarLink(item)} />}
        title={
          <CustomLink onClick={() => onView?.(item)}>{item.FULL_NAME}</CustomLink>
        }
        description={
          <CustomSpace
            direction={'horizontal'}
            split={item.ROLES ? <CustomDivider type={'vertical'} /> : undefined}
          >
            <span>@{item.USERNAME}</span>
            <CustomSpace direction={'horizontal'}>
              {item.ROLES?.split(',').map((rol) => (
                <CustomTag key={`${item.USER_ID}-${rol}`}>{rol}</CustomTag>
              ))}
            </CustomSpace>
            <CustomTag color={item.STATE === 'A' ? 'green' : 'default'}>
              {item.STATE === 'A' ? 'Activo' : 'Inactivo'}
            </CustomTag>
          </CustomSpace>
        }
      />
    </CustomListItem>
  )

  return (
    <CustomList
      dataSource={userList}
      renderItem={renderItem}
      pagination={getTablePagination(metadata)}
    />
  )
}

export default UserList
