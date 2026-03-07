import React from 'react'
import styled from 'styled-components'
import CustomDrawer from 'src/components/custom/CustomDrawer'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomCollapse from 'src/components/custom/CustomCollapse'
import CustomTag from 'src/components/custom/CustomTag'
import CustomTable from 'src/components/custom/CustomTable'
import { ColumnsType } from 'antd/lib/table'
import { CustomText, CustomTitle } from 'src/components/custom/CustomParagraph'
import { RequestItem } from 'src/services/requests/request.types'
import dayjs from 'dayjs'
import formatter from 'src/utils/formatter'
import CustomDivider from 'src/components/custom/CustomDivider'

const SectionTitle = styled(CustomTitle)`
  margin-bottom: 0 !important;
`

interface RequestDetailProps {
  open: boolean
  request?: RequestItem
  onClose: () => void
  statusColors: Record<string, { label: string; color: string }>
}

const RequestDetail: React.FC<RequestDetailProps> = ({
  open,
  request,
  onClose,
  statusColors,
}) => {
  if (!request) {
    return (
      <CustomDrawer open={open} onClose={onClose} width={'48%'}>
        <CustomText type="secondary">
          Selecciona una solicitud para visualizarla.
        </CustomText>
      </CustomDrawer>
    )
  }

  const status = statusColors[request.STATUS] ?? {
    label: request.STATUS,
    color: 'blue',
  }

  const infoItems = [
    {
      key: 'created',
      label: 'Fecha de creación',
      value: dayjs(request.CREATED_AT).format('dddd D MMM YYYY'),
    },
    {
      key: 'status',
      label: 'Estado',
      value: <CustomTag color={status.color}>{status.label}</CustomTag>,
    },
    {
      key: 'coordinator',
      label: 'Coordinador asignado',
      value: request.ASSIGNED_COORDINATOR ?? 'Sin asignar',
    },
    {
      key: 'type',
      label: 'Tipo de solicitud',
      value: request.REQUEST_TYPE,
    },
    {
      key: 'next',
      label: 'Próxima cita',
      value: request.NEXT_APPOINTMENT
        ? dayjs(request.NEXT_APPOINTMENT).format('DD MMM YYYY')
        : 'No programada',
    },
    {
      key: 'notes',
      label: 'Notas',
      value: request.NOTES ?? 'N/A',
      span: 24,
    },
  ]

  const contactColumns: ColumnsType<{
    type: string
    value: string
  }> = [
    {
      dataIndex: 'type',
      key: 'type',
      title: 'Tipo',
      width: '20%',
    },
    {
      dataIndex: 'value',
      key: 'value',
      title: 'Valor',
    },
  ]

  const contacts = [
    {
      key: 'email',
      type: 'EMAIL',
      value: request.CONTACT_EMAIL ?? 'N/A',
    },
    {
      key: 'phone',
      type: 'PHONE',
      value: request.CONTACT_PHONE
        ? formatter({ value: request.CONTACT_PHONE, format: 'phone' })
        : 'N/A',
    },
  ]

  return (
    <CustomDrawer open={open} onClose={onClose} width={'48%'}>
      <CustomDivider>
        <CustomTitle level={5}>Detalle de solicitud</CustomTitle>
      </CustomDivider>
      <CustomCollapse
        defaultActiveKey={[1, 2, 3]}
        items={[
          {
            key: 1,
            label: <SectionTitle level={4}>Solicitante</SectionTitle>,
            children: (
              <CustomRow gutter={[16, 16]}>
                <CustomCol xs={24} md={12}>
                  <CustomText type="secondary">Nombre</CustomText>
                  <div>
                    {request.NAME} {request.LAST_NAME}
                  </div>
                </CustomCol>
                <CustomCol xs={24} md={12}>
                  <CustomText type="secondary">Documento</CustomText>
                  <div>
                    {formatter({
                      value: request.IDENTITY_DOCUMENT,
                      format: 'document',
                    })}
                  </div>
                </CustomCol>
                <CustomCol xs={24} md={12}>
                  <CustomText type="secondary">Universidad</CustomText>
                  <div>{request.UNIVERSITY}</div>
                </CustomCol>
                <CustomCol xs={24} md={12}>
                  <CustomText type="secondary">Programa</CustomText>
                  <div>{request.CAREER}</div>
                </CustomCol>
                <CustomCol xs={24} md={12}>
                  <CustomText type="secondary">Cohorte</CustomText>
                  <div>{request.COHORT ?? 'N/A'}</div>
                </CustomCol>
              </CustomRow>
            ),
          },
          {
            key: 2,
            label: (
              <SectionTitle level={4}>Información de solicitud</SectionTitle>
            ),
            children: (
              <CustomRow gutter={[16, 16]}>
                {infoItems.map((item) => (
                  <CustomCol
                    key={item.key}
                    xs={item.span ?? 24}
                    md={item.span ?? 12}
                  >
                    <CustomText type="secondary">{item.label}</CustomText>
                    <div>{item.value || 'N/A'}</div>
                  </CustomCol>
                ))}
              </CustomRow>
            ),
          },
          {
            key: 3,
            label: <SectionTitle level={4}>Contactos</SectionTitle>,
            children: (
              <CustomTable
                columns={contactColumns}
                dataSource={contacts}
                pagination={false}
                rowKey="key"
              />
            ),
          },
        ]}
      />
    </CustomDrawer>
  )
}

export default RequestDetail
