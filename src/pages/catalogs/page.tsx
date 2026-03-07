import {
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { Form, ListProps, TableProps } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import React, { useCallback, useEffect, useState } from 'react'
import ConditionalComponent from 'src/components/ConditionalComponent'
import CustomButton from 'src/components/custom/CustomButton'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomList from 'src/components/custom/CustomList'
import CustomListItem from 'src/components/custom/CustomListItem'
import CustomListItemMeta from 'src/components/custom/CustomListItemMeta'
import { CustomText } from 'src/components/custom/CustomParagraph'
import CustomRow from 'src/components/custom/CustomRow'
import CustomTooltip from 'src/components/custom/CustomTooltip'
import SmartTable from 'src/components/SmartTable'
import StateSelector from 'src/components/StateSelector'
import useDebounce from 'src/hooks/use-debounce'
import { Catalog, CatalogItem } from 'src/services/catalog/catalog.types'
import { useGetCataloguePaginationMutation } from 'src/services/catalog/useGetCataloguePaginationMutation'
import { useCatalogStore } from 'src/store/catalog.store'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import styled from 'styled-components'
import CatalogForm from './components/CatalogForm'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { useUpdateCatalogueMutation } from 'src/services/catalog/useUpdateCatalogueMutation'
import { useCustomNotifications } from 'src/hooks/use-custom-notification'
import { useUpdateCatalogItemMutation } from 'src/services/catalog/useUpdateCatalogItemMutation'
import { useCustomModal } from 'src/hooks/use-custom-modal'

const ListContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  padding-left: 100px;
`

const initialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const Page: React.FC = () => {
  const [errorHandler] = useErrorHandler()
  const { confirmModal } = useCustomModal()
  const { successNotification } = useCustomNotifications()
  const [form] = Form.useForm()

  const [record, setRecord] = useState<Catalog>()
  const [catalogModalState, setCatalogModalState] = useState<boolean>()
  const [searchKey, setSearchKey] = useState('')
  const debounce = useDebounce(searchKey)

  const { metadata, catalogList } = useCatalogStore()

  const { mutate: getCatalog, isPending: isGetCatalogPending } =
    useGetCataloguePaginationMutation()
  const { mutateAsync: updateCatalogItem, isPending: isUpdateItemPending } =
    useUpdateCatalogItemMutation()
  const { mutateAsync: updateCatalog, isPending: isUpdatePending } =
    useUpdateCatalogueMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = initialFilter.FILTER } = form.getFieldsValue()

      const filter = getConditionFromForm(FILTER)

      const condition: AdvancedCondition<Catalog>[] = [...filter]

      getCatalog({ page, size, condition })
    },
    [debounce, catalogModalState]
  )

  useEffect(handleSearch, [handleSearch])

  const toggleModalState = () => setCatalogModalState(!catalogModalState)

  const handleEdit = (record: Catalog) => {
    setRecord(record)
    toggleModalState()
  }

  const handleUpdate = async (record: Catalog) => {
    confirmModal({
      title: 'Confirmación',
      content: '¿Seguro que desea cambiar el estado del catálogo?',
      onOk: async () => {
        try {
          await updateCatalog({
            CATALOG_ID: record.CATALOG_ID,
            KEY: record.KEY,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          })

          successNotification({
            message: 'Operación exitosa',
            description: 'Estado del item fue actualizado exitosamente.',
          })
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const handleUpdateItem = async (record: CatalogItem) => {
    const isActive = record.STATE === 'A'
    confirmModal({
      title: 'Confirmación',
      content: `¿Seguro que dea ${
        isActive ? 'Inhabilitar' : 'Habilitar'
      } el item.`,
      onOk: async () => {
        try {
          await updateCatalogItem({
            catalogId: record.CATALOG_ID,
            itemId: record.ITEM_ID,
            values: { STATE: isActive ? 'I' : 'A' },
          })

          successNotification({
            message: 'Operación exitosa',
            description: 'El estado del item fue actualizado exitosamente.',
          })

          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<Catalog> = [
    {
      dataIndex: 'CATALOG_ID',
      key: 'CATALOG_ID',
      title: 'Código',
      width: '5%',
      align: 'center',
    },
    {
      dataIndex: 'NAME',
      key: 'NAME',
      title: 'Nombre',
    },
    {
      dataIndex: 'DESCRIPTION',
      key: 'DESCRIPTION',
      title: 'Descripción',
    },
  ]

  const renderItem: ListProps<CatalogItem>['renderItem'] = (item) => {
    const isActive = item.STATE === 'A'
    return (
      <CustomListItem
        extra={[
          <CustomTooltip title={isActive ? 'Inhabilitar' : 'Habilitar'}>
            <CustomButton
              disabled={item?.['CATALOG_STATE'] === 'I'}
              type={'link'}
              danger={isActive}
              onClick={() => handleUpdateItem(item)}
              icon={
                isActive ? (
                  <DeleteOutlined />
                ) : (
                  <StopOutlined className={'btn-disabled'} />
                )
              }
            />
          </CustomTooltip>,
        ]}
      >
        <CustomListItemMeta
          description={
            <CustomText delete={!isActive} disabled={!isActive}>
              {item.LABEL}
            </CustomText>
          }
          title={
            <CustomText
              disabled={!isActive}
              delete={!isActive}
              type={'secondary'}
            >
              {item.VALUE}
            </CustomText>
          }
        />
      </CustomListItem>
    )
  }

  const expandable: TableProps<Catalog>['expandable'] = {
    indentSize: 100,
    rowExpandable: (record) => !!record.ITEMS?.length,
    expandIcon: ({ expanded, onExpand, record }) => (
      <ConditionalComponent
        condition={expanded}
        fallback={<PlusOutlined onClick={(e) => onExpand(record, e)} />}
      >
        <MinusOutlined onClick={(e) => onExpand(record, e)} />
      </ConditionalComponent>
    ),
    expandedRowRender: (record) => {
      const dataSource = record.ITEMS.map((item) => ({
        ...item,
        CATALOG_STATE: record.STATE,
      }))

      return (
        <ListContainer>
          <CustomList
            itemLayout={'vertical'}
            pagination={false}
            renderItem={renderItem}
            dataSource={dataSource}
          />
        </ListContainer>
      )
    },
  }

  const filter = (
    <CustomRow>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Estado'}
          name={['FILTER', 'STATE__IN']}
          labelCol={{ span: 24 }}
        >
          <StateSelector />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  return (
    <>
      <SmartTable
      exportable
        columns={columns}
        createText={'Crear Catálogo'}
        dataSource={catalogList}
        expandable={expandable}
        filter={filter}
        form={form}
        initialFilter={initialFilter}
        loading={isGetCatalogPending || isUpdatePending || isUpdateItemPending}
        metadata={metadata}
        onChange={handleSearch}
        onCreate={toggleModalState}
        onSearch={setSearchKey}
        rowKey={'CATALOG_ID'}
        onEdit={handleEdit}
        onUpdate={handleUpdate}
      />

      <ConditionalComponent condition={catalogModalState}>
        <CatalogForm
          catalogId={record?.CATALOG_ID}
          open={catalogModalState}
          onClose={() => {
            setRecord(undefined)
            toggleModalState()
          }}
        />
      </ConditionalComponent>
    </>
  )
}

export default Page
