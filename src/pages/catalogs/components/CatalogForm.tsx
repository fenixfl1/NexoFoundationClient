import { CloseOutlined, StopOutlined } from '@ant-design/icons'
import { Form } from 'antd'
import React, { useCallback, useEffect } from 'react'
import ConditionalComponent from 'src/components/ConditionalComponent'
import CustomAlert from 'src/components/custom/CustomAlert'
import CustomButton from 'src/components/custom/CustomButton'
import CustomCol from 'src/components/custom/CustomCol'
import CustomCollapseFormList, {
  RemoveFn,
} from 'src/components/custom/CustomCollapseFormList'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomForm from 'src/components/custom/CustomForm'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomModal from 'src/components/custom/CustomModal'
import { CustomTitle } from 'src/components/custom/CustomParagraph'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTextArea from 'src/components/custom/CustomTextArea'
import {
  defaultBreakpoints,
  formItemLayout,
  labelColFullWidth,
} from 'src/config/breakpoints'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { useCustomNotifications } from 'src/hooks/use-custom-notification'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import queryClient from 'src/lib/query-client'
import { Catalog, CatalogItem } from 'src/services/catalog/catalog.types'
import { useCreateCatalogItemMutation } from 'src/services/catalog/useCreateCatalogItemMutation'
import { useCreateCatalogueMutation } from 'src/services/catalog/useCreateCatalogueMutation'
import { useGetOneCatalogQuery } from 'src/services/catalog/useGetOneCatalogQuery'
import { useUpdateCatalogItemMutation } from 'src/services/catalog/useUpdateCatalogItemMutation'
import { useUpdateCatalogueMutation } from 'src/services/catalog/useUpdateCatalogueMutation'
import { useCatalogStore } from 'src/store/catalog.store'

type CatalogExtraFormValue = {
  ORDER?: number
  key?: string
  value?: string
}

type CatalogItemFormValue = Partial<Omit<CatalogItem, 'EXTRA'>> & {
  EXTRA?: CatalogExtraFormValue[]
}

type CatalogFormValues = Partial<Omit<Catalog, 'ITEMS'>> & {
  ITEMS?: CatalogItemFormValue[]
}

const normalizeExtraEntries = (
  extra?: CatalogItem['EXTRA'] | CatalogExtraFormValue[]
): CatalogExtraFormValue[] => {
  if (Array.isArray(extra)) {
    return extra.map((entry) => ({ ...entry }))
  }

  if (extra && typeof extra === 'object') {
    return Object.entries(extra).map(([key, value], index) => ({
      ORDER: index + 1,
      key,
      value: value as string,
    }))
  }

  return []
}

const mapCatalogItemsToFormValues = (
  items?: Catalog['ITEMS']
): CatalogItemFormValue[] =>
  (items ?? []).map((item) => ({
    ...item,
    EXTRA: normalizeExtraEntries(item.EXTRA),
  }))

const cloneCatalogItems = (
  items: CatalogItemFormValue[] = []
): CatalogItemFormValue[] =>
  items.map((item) => ({
    ...item,
    EXTRA: item.EXTRA?.map((extra) => ({ ...extra })),
  }))

const serializeExtraEntries = (
  entries?: CatalogExtraFormValue[]
): Record<string, string> =>
  (entries ?? []).reduce<Record<string, string>>((acc, curr) => {
    if (!curr?.key) {
      return acc
    }

    acc[curr.key] = String(curr.value ?? '')
    return acc
  }, {})

const areExtraEntriesEqual = (
  current?: CatalogExtraFormValue[],
  initial?: CatalogExtraFormValue[]
) => {
  const sanitize = (entries?: CatalogExtraFormValue[]) =>
    (entries ?? [])
      .filter((entry) => entry?.key || entry?.value)
      .map((entry) => ({
        key: entry?.key ?? '',
        value: String(entry?.value ?? ''),
      }))
      .sort((a, b) =>
        a.key === b.key
          ? a.value.localeCompare(b.value)
          : a.key.localeCompare(b.key)
      )

  const currentEntries = sanitize(current)
  const initialEntries = sanitize(initial)

  if (currentEntries.length !== initialEntries.length) {
    return false
  }

  return currentEntries.every(
    (entry, index) =>
      entry.key === initialEntries[index].key &&
      entry.value === initialEntries[index].value
  )
}

const areCatalogItemsEqual = (
  current?: CatalogItemFormValue,
  initial?: CatalogItemFormValue
) => {
  if (!current || !initial) {
    return false
  }

  return (
    (current.LABEL ?? '') === (initial.LABEL ?? '') &&
    (current.VALUE ?? '') === (initial.VALUE ?? '') &&
    areExtraEntriesEqual(current.EXTRA, initial.EXTRA)
  )
}

interface CatalogFormProps {
  open?: boolean
  onClose?: () => void
  catalogId?: number
}

const CatalogForm: React.FC<CatalogFormProps> = ({
  catalogId,
  open,
  onClose,
}) => {
  const [errorHandler] = useErrorHandler()
  const { confirmModal } = useCustomModal()
  const { successNotification } = useCustomNotifications()
  const [form] = Form.useForm<CatalogFormValues>()
  const [initialItems, setInitialItems] = React.useState<
    CatalogItemFormValue[]
  >([])
  const items = Form.useWatch('ITEMS', form) as
    | CatalogItemFormValue[]
    | undefined

  const { isFetching: isGetCatalogFetching } = useGetOneCatalogQuery(catalogId)
  const { mutateAsync: createCatalogue, isPending: isCreatePending } =
    useCreateCatalogueMutation()
  const { mutateAsync: createCatalogItem, isPending: isCreateItemPending } =
    useCreateCatalogItemMutation()
  const { mutateAsync: updateCatalogue, isPending: isUpdatePending } =
    useUpdateCatalogueMutation()
  const { mutateAsync: updateCatalogItem, isPending: isUpdateItemPending } =
    useUpdateCatalogItemMutation()

  const { catalog } = useCatalogStore()
  const isEditing = !!catalogId

  useEffect(() => {
    if (catalogId) {
      const normalizedItems = mapCatalogItemsToFormValues(catalog.ITEMS)

      form.setFieldsValue({
        ...catalog,
        ITEMS: normalizedItems,
      })

      setInitialItems(cloneCatalogItems(normalizedItems))
      return
    }

    form.resetFields()
    setInitialItems([])
  }, [catalog, catalogId, form])

  const refreshCatalog = async () => {
    if (!catalogId) {
      return
    }

    await queryClient.invalidateQueries({
      queryKey: ['catalog', 'get-one-catalog', catalogId],
    })
  }

  const handleOnFinish = async () => {
    try {
      const { ITEMS = [], ...values } = await form.validateFields()
      const formItems = ITEMS as CatalogItemFormValue[]
      const formItemsSnapshot = cloneCatalogItems(formItems)
      const catalogName = (values.NAME ?? '').trim()

      const payload: Catalog = {
        ...(values as Catalog),
        KEY: 'cta_' + catalogName.replace(/\s/g, '_').toLowerCase(),
        ITEMS: formItems.map((item) => ({
          ...item,
          EXTRA: serializeExtraEntries(item.EXTRA),
        })) as Catalog['ITEMS'],
      }

      let message = 'Catalogo creado exitosamente.'

      if (payload.CATALOG_ID) {
        await updateCatalogue(payload)
        message = `Catalogo con id '${payload.CATALOG_ID}' actualizado exitosamente.`
        await refreshCatalog()
      } else {
        await createCatalogue(payload)
      }

      setInitialItems(formItemsSnapshot)

      successNotification({
        message: 'Operacion exitosa',
        description: message,
      })

      onClose?.()
    } catch (error) {
      errorHandler(error)
    }
  }

  const handleSaveItem = async (index: number) => {
    const currentItems = (form.getFieldValue('ITEMS') ??
      []) as CatalogItemFormValue[]
    const item = currentItems?.[index]

    if (!catalogId || !catalog?.KEY || !item) {
      return
    }

    const values = {
      LABEL: item.LABEL,
      ORDER: item.ORDER,
      STATE: item.STATE,
      VALUE: item.VALUE,
      EXTRA: serializeExtraEntries(item.EXTRA),
    }

    try {
      if (item.ITEM_ID) {
        await updateCatalogItem({
          catalogId,
          itemId: item.ITEM_ID,
          values,
        })
      } else {
        await createCatalogItem({
          key: catalog.KEY,
          values,
        })
      }

      await refreshCatalog()
    } catch (error) {
      errorHandler(error)
    }
  }

  const handleClose = () => {
    form.resetFields()
    setInitialItems([])
    onClose?.()
  }

  const hasItemChange = useCallback(
    (index: number): boolean => {
      if (!isEditing) {
        return false
      }

      const currentItem = items?.[index]

      if (!currentItem) {
        return false
      }

      if (!currentItem.ITEM_ID) {
        return true
      }

      const baseItem =
        initialItems.find((item) => item.ITEM_ID === currentItem.ITEM_ID) ??
        initialItems[index]

      if (!baseItem) {
        return true
      }

      return !areCatalogItemsEqual(currentItem, baseItem)
    },
    [initialItems, isEditing, items]
  )

  const handleRuleOut = (index: number) => {
    const currentItems = (form.getFieldValue('ITEMS') ??
      []) as CatalogItemFormValue[]
    const targetItem = currentItems[index]

    if (!targetItem) {
      return
    }

    if (!targetItem.ITEM_ID) {
      form.setFieldsValue({
        ITEMS: currentItems.filter((_, idx) => idx !== index),
      })
      return
    }

    const baseItem =
      initialItems.find((item) => item.ITEM_ID === targetItem.ITEM_ID) ??
      initialItems[index]

    if (!baseItem) {
      return
    }

    const restoredItems = [...currentItems]
    restoredItems[index] = {
      ...baseItem,
      EXTRA: baseItem.EXTRA?.map((extra) => ({ ...extra })),
    }

    form.setFieldsValue({ ITEMS: restoredItems })
  }

  const handleRemoveItem = async (index: number, remove: RemoveFn) => {
    const item = items?.[index]

    if (!item) {
      return
    }

    const isActive = item.STATE === 'A'

    if (item.ITEM_ID) {
      return confirmModal({
        title: 'Confirmación',
        content: (
          <p>
            Deseas {isActive ? 'inhabilitar' : 'habilitar'} el item{' '}
            <strong>"{item.LABEL}"</strong>?
          </p>
        ),
        onOk: async () => {
          try {
            await updateCatalogItem({
              catalogId,
              itemId: item.ITEM_ID!,
              values: {
                STATE: isActive ? 'I' : 'A',
              },
            })

            await refreshCatalog()
          } catch (error) {
            errorHandler(error)
          }
        },
      })
    }

    remove(index)
  }

  return (
    <CustomModal
      onCancel={handleClose}
      onOk={handleOnFinish}
      open={open}
      preventClose
      title={'Formulario de Catalogo'}
      width={'50%'}
    >
      <CustomSpin
        spinning={
          isCreatePending ||
          isCreateItemPending ||
          isUpdatePending ||
          isUpdateItemPending ||
          isGetCatalogFetching
        }
      >
        <CustomAlert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            'Puedes crear un catalogo y agregar items a este. Cada item puede tener un conjunto de claves y valores adicionales que se pueden utilizar para almacenar información extra.'
          }
        />
        <CustomForm form={form} {...formItemLayout}>
          <CustomRow>
            <CustomFormItem hidden name={'KEY'} />
            <CustomFormItem hidden name={'CATALOG_ID'} />
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Nombre'}
                name={'NAME'}
                rules={[{ required: true }]}
                {...labelColFullWidth}
              >
                <CustomInput placeholder={'Nombre del catalogo'} />
              </CustomFormItem>
            </CustomCol>
            <CustomCol xs={24}>
              <CustomFormItem
                label={'Descripción'}
                name={'DESCRIPTION'}
                {...labelColFullWidth}
              >
                <CustomTextArea placeholder={'Descripción del catalogo'} />
              </CustomFormItem>
            </CustomCol>

            <CustomDivider style={{ margin: '0' }}>
              <CustomTitle level={4}>Items</CustomTitle>
            </CustomDivider>

            <CustomCol xs={24}>
              <CustomFormItem label={'  '} colon={false} {...labelColFullWidth}>
                <CustomCollapseFormList
                  form={form}
                  name={'ITEMS'}
                  initialValue={[{ EXTRA: [{ ORDER: 1 }] }]}
                  itemLabel={(index) => items?.[index]?.LABEL}
                  addText={'Agregar item'}
                  onRemove={handleRemoveItem}
                  removeIcon={(index) => {
                    const item = items?.[index]
                    if (item?.STATE === 'I') {
                      return <StopOutlined style={{ color: '#333' }} />
                    }

                    return <CloseOutlined />
                  }}
                >
                  {(field) => {
                    const isActive = items?.[field.name]?.STATE !== 'I'

                    return (
                      <CustomRow gutter={[16, 16]} key={field.key}>
                        <CustomCol {...defaultBreakpoints}>
                          <CustomFormItem
                            label={'Etiqueta'}
                            name={[field.name, 'LABEL']}
                            rules={[{ required: true }]}
                          >
                            <CustomInput
                              disabled={!isActive}
                              placeholder={'Etiqueta'}
                            />
                          </CustomFormItem>
                        </CustomCol>
                        <CustomCol {...defaultBreakpoints}>
                          <CustomFormItem
                            label={'Valor'}
                            name={[field.name, 'VALUE']}
                            rules={[{ required: true }]}
                          >
                            <CustomInput
                              disabled={!isActive}
                              placeholder={'Valor de la etiqueta'}
                            />
                          </CustomFormItem>
                        </CustomCol>

                        <CustomDivider>
                          <CustomTitle level={4}>Extras</CustomTitle>
                        </CustomDivider>

                        <CustomCol xs={24}>
                          <CustomFormItem
                            label={'  '}
                            colon={false}
                            labelCol={{ span: 3 }}
                          >
                            <CustomCollapseFormList
                              form={form}
                              addButtonPosition={'bottom'}
                              disabled={!isActive}
                              name={[field.name, 'EXTRA']}
                              sort={'desc'}
                              itemLabel={(index) =>
                                items?.[field.name]?.EXTRA?.[index]?.key
                              }
                            >
                              {(subField) => (
                                <CustomSpace direction={'horizontal'}>
                                  <CustomFormItem
                                    hidden
                                    name={[subField.name, 'ORDER']}
                                  />
                                  <CustomFormItem
                                    name={[subField.name, 'key']}
                                    rules={[{ required: true }]}
                                  >
                                    <CustomInput
                                      disabled={!isActive}
                                      placeholder={'Clave'}
                                    />
                                  </CustomFormItem>
                                  <CustomFormItem
                                    name={[subField.name, 'value']}
                                    rules={[{ required: true }]}
                                  >
                                    <CustomInput
                                      disabled={!isActive}
                                      placeholder={'Valor'}
                                    />
                                  </CustomFormItem>
                                </CustomSpace>
                              )}
                            </CustomCollapseFormList>
                          </CustomFormItem>
                        </CustomCol>

                        <ConditionalComponent
                          condition={isEditing && hasItemChange(field.name)}
                        >
                          <CustomRow justify={'end'} width={'100%'} gap={10}>
                            <CustomButton
                              danger
                              onClick={() => handleRuleOut(field.name)}
                            >
                              Descartar
                            </CustomButton>
                            <CustomButton
                              type={'primary'}
                              onClick={() => handleSaveItem(field.name)}
                            >
                              Guardar
                            </CustomButton>
                          </CustomRow>
                        </ConditionalComponent>
                      </CustomRow>
                    )
                  }}
                </CustomCollapseFormList>
              </CustomFormItem>
            </CustomCol>
          </CustomRow>
        </CustomForm>
      </CustomSpin>
    </CustomModal>
  )
}

export default CatalogForm
