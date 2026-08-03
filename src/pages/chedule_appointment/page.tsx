import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { Badge, Calendar } from 'antd'
import CustomButton from 'src/components/custom/CustomButton'
import CustomCard from 'src/components/custom/CustomCard'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomList from 'src/components/custom/CustomList'
import CustomListItem from 'src/components/custom/CustomListItem'
import CustomListItemMeta from 'src/components/custom/CustomListItemMeta'
import { CustomText } from 'src/components/custom/CustomParagraph'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTag from 'src/components/custom/CustomTag'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import { Appointment } from 'src/services/appointments/appointment.types'
import { useGetAppointmentPaginationMutation } from 'src/services/appointments/useGetAppointmentPaginationMutation'
import { useAppointmentStore } from 'src/store/appointment.store'
import { AdvancedCondition } from 'src/types/general'
import AppointmentForm from './components/AppointmentForm'

const statusMeta = {
  scheduled: { color: 'geekblue', label: 'Programada', badge: 'processing' },
  completed: { color: 'green', label: 'Completada', badge: 'success' },
  cancelled: { color: 'red', label: 'Cancelada', badge: 'error' },
} as const

const SchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment>()
  const [errorHandler] = useErrorHandler()

  const { appointments } = useAppointmentStore()
  const { mutate: getAppointments, isPending } =
    useGetAppointmentPaginationMutation()

  const handleFetch = useCallback(async () => {
    try {
      const condition: AdvancedCondition<Appointment>[] = [
        {
          field: 'STATE',
          operator: '=',
          value: 'A',
        },
      ]

      getAppointments({ page: 1, size: 200, condition })
    } catch (error) {
      errorHandler(error)
    }
  }, [errorHandler, getAppointments])

  useEffect(() => {
    handleFetch()
  }, [handleFetch])

  const appointmentsByDate = useMemo(() => {
    return appointments.reduce<Record<string, Appointment[]>>((acc, record) => {
      const key = dayjs(record.START_AT).format('YYYY-MM-DD')
      if (!acc[key]) acc[key] = []
      acc[key].push(record)
      return acc
    }, {})
  }, [appointments])

  const selectedAppointments = useMemo(() => {
    const key = selectedDate.format('YYYY-MM-DD')
    return appointmentsByDate[key] ?? []
  }, [appointmentsByDate, selectedDate])

  const handleCreate = () => {
    setEditing(undefined)
    setModalOpen(true)
  }

  const handleEdit = (appointment: Appointment) => {
    setEditing(appointment)
    setModalOpen(true)
  }

  const dateCellRender = (date: Dayjs) => {
    const key = date.format('YYYY-MM-DD')
    const events = appointmentsByDate[key]

    if (!events?.length) return null

    return (
      <ul
        className="agenda-cell"
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        {events.slice(0, 3).map((item) => (
          <li key={item.APPOINTMENT_ID}>
            <Badge
              status={statusMeta[item.STATUS].badge as never}
              text={item.TITLE}
            />
          </li>
        ))}
        {events.length > 3 && <li>+{events.length - 3} mas</li>}
      </ul>
    )
  }

  return (
    <>
      <CustomSpin spinning={isPending}>
        <CustomRow gutter={[16, 16]} align="top">
          <CustomCol xs={24} md={16}>
            <CustomCard>
              <Calendar
                value={selectedDate}
                onSelect={(value) => setSelectedDate(value)}
                cellRender={dateCellRender}
              />
            </CustomCard>
          </CustomCol>
          <CustomCol xs={24} md={8}>
            <CustomCard>
              <CustomRow justify="space-between" align="middle">
                <CustomText strong>{selectedDate.format('dddd, DD MMMM')}</CustomText>
                <CustomButton type="primary" onClick={handleCreate}>
                  Nueva cita
                </CustomButton>
              </CustomRow>
              <CustomDivider />
              <CustomList
                dataSource={selectedAppointments}
                locale={{ emptyText: 'No hay citas para este dia.' }}
                renderItem={(item) => (
                  <CustomListItem
                    key={item.APPOINTMENT_ID}
                    actions={[
                      <CustomButton
                        key="edit"
                        type="link"
                        onClick={() => handleEdit(item)}
                      >
                        Editar
                      </CustomButton>,
                    ]}
                  >
                    <CustomListItemMeta
                      title={item.TITLE}
                      description={`${dayjs(item.START_AT).format('HH:mm')} ${
                        item.END_AT ? `- ${dayjs(item.END_AT).format('HH:mm')}` : ''
                      }`}
                    />
                    <CustomTag color={statusMeta[item.STATUS].color}>
                      {statusMeta[item.STATUS].label}
                    </CustomTag>
                    {item.LOCATION ? (
                      <CustomText type="secondary">{item.LOCATION}</CustomText>
                    ) : null}
                    {item.DESCRIPTION ? (
                      <CustomText>{item.DESCRIPTION}</CustomText>
                    ) : null}
                  </CustomListItem>
                )}
              />
            </CustomCard>
          </CustomCol>
        </CustomRow>
      </CustomSpin>

      <AppointmentForm
        open={modalOpen}
        appointment={editing}
        initialDate={selectedDate}
        onClose={() => {
          setModalOpen(false)
          setEditing(undefined)
        }}
        onSuccess={handleFetch}
      />
    </>
  )
}

export default SchedulePage
