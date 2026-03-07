import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import SmartTable from 'src/components/SmartTable'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import StateSelector from 'src/components/StateSelector'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomTag from 'src/components/custom/CustomTag'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomTooltip from 'src/components/custom/CustomTooltip'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomButton from 'src/components/custom/CustomButton'
import { ColumnsType } from 'antd/lib/table'
import { useNotificationTemplateStore } from 'src/store/notification-template.store'
import { useNotificationStore } from 'src/store/notification.store'
import { useGetNotificationTemplatePaginationMutation } from 'src/services/notification-templates/useGetNotificationTemplatePaginationMutation'
import { useGetNotificationPaginationMutation } from 'src/services/notifications/useGetNotificationPaginationMutation'
import { useUpdateNotificationTemplateMutation } from 'src/services/notification-templates/useUpdateNotificationTemplateMutation'
import { useUpdateNotificationMutation } from 'src/services/notifications/useUpdateNotificationMutation'
import { NotificationTemplate } from 'src/services/notification-templates/notification-template.types'
import { NotificationItem } from 'src/services/notifications/notification.types'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import useDebounce from 'src/hooks/use-debounce'
import ConditionalComponent from 'src/components/ConditionalComponent'
import TemplateForm from './components/TemplateForm'
import NotificationForm from './components/NotificationForm'
import NotificationDetail from './components/NotificationDetail'
import {
  notificationChannelOptions,
  notificationStatusOptions,
} from './constants'
import ModuleSummary from 'src/components/ModuleSummary'
import { CustomTitle, CustomText } from 'src/components/custom/CustomParagraph'
import formatter from 'src/utils/formatter'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import CustomTabs from 'src/components/custom/CustomTabs'
import { useSearchParams } from 'react-router-dom'
import { EyeOutlined } from '@ant-design/icons'

const templateInitialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const notificationInitialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const TemplatesSection: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<NotificationTemplate>()
  const debounce = useDebounce(searchKey)
  const { templates, metadata } = useNotificationTemplateStore()
  const { mutate: getTemplates, isPending } =
    useGetNotificationTemplatePaginationMutation()
  const { mutateAsync: updateTemplate, isPending: isUpdatePending } =
    useUpdateNotificationTemplateMutation()
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = templateInitialFilter.FILTER } = form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: ['TEMPLATE_KEY', 'NAME', 'CHANNEL', 'MENU_OPTION_NAME'],
        })
      }

      getTemplates({ page, size, condition })
    },
    [form, debounce, metadata.currentPage, metadata.pageSize, getTemplates]
  )

  useEffect(handleSearch, [handleSearch])

  const handleToggleState = (record: NotificationTemplate) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } la plantilla "${record.NAME}"?`,
      onOk: async () => {
        try {
          await updateTemplate({
            TEMPLATE_ID: record.TEMPLATE_ID,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          } as NotificationTemplate)
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<NotificationTemplate> = useMemo(
    () => [
      {
        dataIndex: 'TEMPLATE_KEY',
        key: 'TEMPLATE_KEY',
        title: 'Clave',
      },
      {
        dataIndex: 'NAME',
        key: 'NAME',
        title: 'Nombre',
      },
      {
        dataIndex: 'CHANNEL',
        key: 'CHANNEL',
        title: 'Canal',
        render: (value: string) => {
          const option = notificationChannelOptions.find(
            (item) => item.value === value
          )

          return (
            <CustomTag color="blue">
              {option?.label ?? value.toUpperCase()}
            </CustomTag>
          )
        },
      },
      {
        dataIndex: 'MENU_OPTION_NAME',
        key: 'MENU_OPTION_NAME',
        title: 'Opción de menú',
      },
      {
        dataIndex: 'SUBJECT',
        key: 'SUBJECT',
        title: 'Asunto',
      },
    ],
    []
  )

  const filter = (
    <CustomRow gutter={[8, 8]}>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Estado'}
          name={['FILTER', 'STATE__IN']}
          labelCol={{ span: 24 }}
        >
          <StateSelector />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Canal'}
          name={['FILTER', 'CHANNEL__EQ']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            placeholder="Seleccionar canal"
            allowClear
            options={notificationChannelOptions}
          />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  return (
    <>
      <SmartTable
      exportable
        form={form}
        rowKey="TEMPLATE_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={templates}
        metadata={metadata}
        createText={'Nueva plantilla'}
        searchPlaceholder={'Buscar plantillas...'}
        onCreate={() => {
          setEditing(undefined)
          setModalOpen(true)
        }}
        onChange={handleSearch}
        onSearch={setSearchKey}
        onEdit={(record) => {
          setEditing(record)
          setModalOpen(true)
        }}
        onUpdate={handleToggleState}
        filter={filter}
        initialFilter={templateInitialFilter}
      />

      <ConditionalComponent condition={modalOpen}>
        <TemplateForm
          open={modalOpen}
          template={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(undefined)
          }}
          onSuccess={handleSearch}
        />
      </ConditionalComponent>
    </>
  )
}

const NotificationsSection: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<NotificationItem>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<number>()
  const debounce = useDebounce(searchKey)
  const { notifications, metadata, summary } = useNotificationStore()
  const { mutate: getNotifications, isPending } =
    useGetNotificationPaginationMutation()
  const { mutateAsync: updateNotification, isPending: isUpdatePending } =
    useUpdateNotificationMutation()
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = notificationInitialFilter.FILTER } =
        form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: ['RECIPIENT', 'SUBJECT', 'TEMPLATE_NAME', 'CHANNEL'],
        })
      }

      getNotifications({ page, size, condition })
    },
    [form, debounce, metadata.currentPage, metadata.pageSize, getNotifications]
  )

  useEffect(handleSearch, [handleSearch])

  const handleViewDetail = (record: NotificationItem) => {
    setDetailId(record.NOTIFICATION_ID)
    setDetailOpen(true)
  }

  const handleToggleState = (record: NotificationItem) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } la notificación para "${record.RECIPIENT}"?`,
      onOk: async () => {
        try {
          await updateNotification({
            NOTIFICATION_ID: record.NOTIFICATION_ID,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          } as NotificationItem)
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const statusSummary = useMemo(
    () =>
      notificationStatusOptions.map((item) => ({
        key: item.value,
        title: item.label,
        value: summary?.[item.value] ?? 0,
      })),
    [summary]
  )

  const columns: ColumnsType<NotificationItem> = useMemo(
    () => [
      {
        dataIndex: 'TEMPLATE_NAME',
        key: 'TEMPLATE_NAME',
        title: 'Plantilla',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{record.TEMPLATE_NAME ?? 'Manual'}</CustomText>
            <CustomText type="secondary">{record.TEMPLATE_KEY}</CustomText>
          </CustomSpace>
        ),
      },
      {
        dataIndex: 'RECIPIENT',
        key: 'RECIPIENT',
        title: 'Destinatario',
      },
      {
        dataIndex: 'CHANNEL',
        key: 'CHANNEL',
        title: 'Canal',
        render: (value: string) => {
          const option = notificationChannelOptions.find(
            (item) => item.value === value
          )
          return (
            <CustomTag color="geekblue">
              {option?.label ?? value?.toUpperCase()}
            </CustomTag>
          )
        },
      },
      {
        dataIndex: 'STATUS',
        key: 'STATUS',
        title: 'Estado',
        render: (value: string) => {
          const option = notificationStatusOptions.find(
            (item) => item.value === value
          )
          return (
            <CustomTag color={option?.color as never}>
              {option?.label ?? value}
            </CustomTag>
          )
        },
      },
      {
        dataIndex: 'SCHEDULED_AT',
        key: 'SCHEDULED_AT',
        title: 'Programada',
        render: (value: string) =>
          value ? formatter({ value, format: 'datetime' }) : 'No programada',
      },
      {
        dataIndex: 'SENT_AT',
        key: 'SENT_AT',
        title: 'Enviada',
        render: (value: string) =>
          value ? formatter({ value, format: 'datetime' }) : 'Pendiente',
      },
      {
        dataIndex: 'ERROR_MESSAGE',
        key: 'ERROR_MESSAGE',
        title: 'Detalle',
        render: (value: string) =>
          value ? (
            <CustomTooltip title={value}>
              <CustomText type="danger">Ver error</CustomText>
            </CustomTooltip>
          ) : (
            'Sin errores'
          ),
      },
    ],
    [handleViewDetail]
  )

  const extraAction = (_: unknown, record: NotificationItem) => (
    <CustomTooltip title="Ver detalle">
      <CustomButton
        type="link"
        icon={<EyeOutlined />}
        onClick={() => handleViewDetail(record)}
      />
    </CustomTooltip>
  )

  const filter = (
    <CustomRow gutter={[8, 8]}>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Estado del registro'}
          name={['FILTER', 'STATE__IN']}
          labelCol={{ span: 24 }}
        >
          <StateSelector />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Estado del envío'}
          name={['FILTER', 'STATUS__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar estados"
            allowClear
            options={notificationStatusOptions}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Canal'}
          name={['FILTER', 'CHANNEL__EQ']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            placeholder="Seleccionar canal"
            allowClear
            options={notificationChannelOptions}
          />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  return (
    <>
      <ModuleSummary
        total={metadata.totalRows}
        dataSource={statusSummary}
        title={
          <CustomDivider>
            <CustomTitle level={5}>Resumen de notificaciones</CustomTitle>
          </CustomDivider>
        }
      />
      <CustomDivider />
      <SmartTable
      exportable
        form={form}
        extra={extraAction}
        rowKey="NOTIFICATION_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={notifications}
        metadata={metadata}
        createText={'Registrar notificación'}
        searchPlaceholder={'Buscar notificaciones...'}
        onCreate={() => {
          setEditing(undefined)
          setModalOpen(true)
        }}
        onChange={handleSearch}
        onSearch={setSearchKey}
        onEdit={(record) => {
          setEditing(record)
          setModalOpen(true)
        }}
        onUpdate={handleToggleState}
        filter={filter}
        initialFilter={notificationInitialFilter}
      />

      <ConditionalComponent condition={modalOpen}>
        <NotificationForm
          open={modalOpen}
          notification={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(undefined)
          }}
          onSuccess={handleSearch}
        />
      </ConditionalComponent>

      <NotificationDetail
        open={detailOpen}
        notificationId={detailId}
        onClose={() => {
          setDetailOpen(false)
          setDetailId(undefined)
        }}
      />
    </>
  )
}

const TemplatesConfigPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeKey, setActiveKey] = useState<string>('templates')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveKey(tab)
    }
  }, [])

  const handleChangeTab = (key: string) => {
    setSearchParams({ tab: key })
    setActiveKey(key)
  }

  const items = [
    {
      key: 'templates',
      label: 'Plantillas',
      children: <TemplatesSection />,
    },
    {
      key: 'notifications',
      label: 'Historial de notificaciones',
      children: <NotificationsSection />,
    },
  ]

  return (
    <CustomTabs
      activeKey={activeKey}
      items={items}
      style={{ width: '100%' }}
      onTabClick={handleChangeTab}
    />
  )
}

export default TemplatesConfigPage
