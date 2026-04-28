import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import styled from 'styled-components'
import CustomAlert from 'src/components/custom/CustomAlert'
import CustomBadge from 'src/components/custom/CustomBadge'
import CustomButton from 'src/components/custom/CustomButton'
import CustomCalendar from 'src/components/custom/CustomCalendar'
import CustomCard from 'src/components/custom/CustomCard'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomList from 'src/components/custom/CustomList'
import CustomListItem from 'src/components/custom/CustomListItem'
import CustomListItemMeta from 'src/components/custom/CustomListItemMeta'
import { CustomText, CustomTitle } from 'src/components/custom/CustomParagraph'
import CustomResult from 'src/components/custom/CustomResult'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTag from 'src/components/custom/CustomTag'
import ModuleSummary from 'src/components/ModuleSummary'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import {
  Appointment,
  AppointmentStatus,
} from 'src/services/appointments/appointment.types'
import { useGetAppointmentPaginationMutation } from 'src/services/appointments/useGetAppointmentPaginationMutation'
import { useAppointmentStore } from 'src/store/appointment.store'
import { AdvancedCondition } from 'src/types/general'

const CalendarCell = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

const CalendarCellItem = styled.li`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const DetailBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const statusMeta: Record<
  AppointmentStatus,
  { color: string; label: string; badge: 'processing' | 'success' | 'error' }
> = {
  scheduled: {
    color: 'geekblue',
    label: 'Programada',
    badge: 'processing',
  },
  completed: {
    color: 'green',
    label: 'Completada',
    badge: 'success',
  },
  cancelled: {
    color: 'red',
    label: 'Cancelada',
    badge: 'error',
  },
}

const formatAppointmentDate = (value?: string | Dayjs | null) => {
  if (!value) return ''
  return dayjs(value).format('DD/MM/YYYY hh:mm A')
}

const Page: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [errorHandler] = useErrorHandler()

  const { appointments, metadata } = useAppointmentStore()
  const { mutate: getAppointments, isPending } =
    useGetAppointmentPaginationMutation()

  const fetchAppointments = useCallback(() => {
    try {
      const condition: AdvancedCondition<Appointment>[] = [
        {
          field: 'STATE',
          operator: '=',
          value: 'A',
        },
      ]

      getAppointments({ page: 1, size: 500, condition })
    } catch (error) {
      errorHandler(error)
    }
  }, [errorHandler, getAppointments])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => dayjs(a.START_AT).valueOf() - dayjs(b.START_AT).valueOf()
      ),
    [appointments]
  )

  const appointmentsByDate = useMemo(() => {
    return sortedAppointments.reduce<Record<string, Appointment[]>>(
      (acc, appointment) => {
        const key = dayjs(appointment.START_AT).format('YYYY-MM-DD')
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(appointment)
        return acc
      },
      {}
    )
  }, [sortedAppointments])

  const selectedAppointments = useMemo(() => {
    const key = selectedDate.format('YYYY-MM-DD')
    return appointmentsByDate[key] ?? []
  }, [appointmentsByDate, selectedDate])

  const upcomingAppointments = useMemo(() => {
    const now = dayjs()
    return sortedAppointments.filter(
      (appointment) =>
        appointment.STATUS === 'scheduled' &&
        dayjs(appointment.START_AT).isAfter(now)
    )
  }, [sortedAppointments])

  const nextAppointment = upcomingAppointments[0]

  const summaryData = useMemo(() => {
    const now = dayjs()
    const todayKey = now.format('YYYY-MM-DD')
    const weekEnd = now.endOf('week')

    return [
      {
        key: 'upcoming',
        title: 'Proximas',
        value: upcomingAppointments.length,
      },
      {
        key: 'today',
        title: 'Hoy',
        value: appointmentsByDate[todayKey]?.length ?? 0,
      },
      {
        key: 'this_week',
        title: 'Esta semana',
        value: sortedAppointments.filter((appointment) => {
          const time = dayjs(appointment.START_AT).valueOf()
          return time >= now.valueOf() && time <= weekEnd.valueOf()
        }).length,
      },
      {
        key: 'completed',
        title: 'Completadas',
        value: sortedAppointments.filter(
          (appointment) => appointment.STATUS === 'completed'
        ).length,
      },
    ]
  }, [appointmentsByDate, sortedAppointments, upcomingAppointments.length])

  const dateCellRender = (value: Dayjs) => {
    const key = value.format('YYYY-MM-DD')
    const events = appointmentsByDate[key] ?? []

    if (!events.length) return null

    return (
      <CalendarCell>
        {events.slice(0, 3).map((appointment) => (
          <CalendarCellItem key={appointment.APPOINTMENT_ID}>
            <CustomBadge
              status={statusMeta[appointment.STATUS].badge}
              text={appointment.TITLE}
            />
          </CalendarCellItem>
        ))}
        {events.length > 3 ? (
          <CalendarCellItem>
            <CustomText type="secondary">+{events.length - 3} mas</CustomText>
          </CalendarCellItem>
        ) : null}
      </CalendarCell>
    )
  }

  return (
    <CustomSpin spinning={isPending}>
      <CustomSpace size={'large'}>
        <ConditionalRender
          condition={!sortedAppointments.length}
          fallback={
            <CustomSpace size={'large'}>
              <ModuleSummary
                total={metadata.totalRows || sortedAppointments.length}
                dataSource={summaryData}
              />

              <CustomRow gutter={[16, 16]} align={'top'}>
                <CustomCol xs={24} lg={16}>
                  <CustomCard>
                    <CustomRow justify={'space-between'} align={'middle'}>
                      <CustomTitle level={4} style={{ margin: 0 }}>
                        Calendario de citas
                      </CustomTitle>
                      <CustomButton
                        type="default"
                        onClick={() => setSelectedDate(dayjs())}
                      >
                        Ir a hoy
                      </CustomButton>
                    </CustomRow>
                    <CustomDivider />
                    <CustomCalendar
                      value={selectedDate}
                      onSelect={(value) => setSelectedDate(value)}
                      cellRender={dateCellRender}
                    />
                  </CustomCard>
                </CustomCol>

                <CustomCol xs={24} lg={8}>
                  <CustomSpace size={'large'}>
                    <CustomCard>
                      <CustomTitle level={4} style={{ marginTop: 0 }}>
                        Proxima cita
                      </CustomTitle>
                      {nextAppointment ? (
                        <DetailBlock>
                          <CustomTag
                            color={statusMeta[nextAppointment.STATUS].color}
                          >
                            {statusMeta[nextAppointment.STATUS].label}
                          </CustomTag>
                          <CustomText strong>
                            {nextAppointment.TITLE}
                          </CustomText>
                          <CustomText>
                            {formatAppointmentDate(nextAppointment.START_AT)}
                          </CustomText>
                          {nextAppointment.LOCATION ? (
                            <CustomText type="secondary">
                              Lugar: {nextAppointment.LOCATION}
                            </CustomText>
                          ) : null}
                          {nextAppointment.REQUEST_TYPE ? (
                            <CustomText type="secondary">
                              Solicitud: {nextAppointment.REQUEST_TYPE}
                            </CustomText>
                          ) : null}
                          {nextAppointment.DESCRIPTION ? (
                            <CustomText>
                              {nextAppointment.DESCRIPTION}
                            </CustomText>
                          ) : null}
                        </DetailBlock>
                      ) : (
                        <CustomAlert
                          type="info"
                          showIcon
                          message="No tienes citas programadas por el momento."
                        />
                      )}
                    </CustomCard>

                    <CustomCard>
                      <CustomTitle level={4} style={{ marginTop: 0 }}>
                        {selectedDate.format('DD/MM/YYYY')}
                      </CustomTitle>
                      <CustomDivider />
                      <CustomList
                        dataSource={selectedAppointments}
                        locale={{
                          emptyText: 'No hay citas para la fecha seleccionada.',
                        }}
                        renderItem={(appointment) => (
                          <CustomListItem key={appointment.APPOINTMENT_ID}>
                            <CustomListItemMeta
                              title={
                                <CustomSpace>
                                  <CustomText strong>
                                    {appointment.TITLE}
                                  </CustomText>
                                  <CustomTag
                                    color={statusMeta[appointment.STATUS].color}
                                  >
                                    {statusMeta[appointment.STATUS].label}
                                  </CustomTag>
                                </CustomSpace>
                              }
                              description={
                                <DetailBlock>
                                  <CustomText>
                                    {formatAppointmentDate(
                                      appointment.START_AT
                                    )}
                                    {appointment.END_AT
                                      ? ` - ${dayjs(appointment.END_AT).format('hh:mm A')}`
                                      : ''}
                                  </CustomText>
                                  {appointment.LOCATION ? (
                                    <CustomText type="secondary">
                                      Lugar: {appointment.LOCATION}
                                    </CustomText>
                                  ) : null}
                                  {appointment.UNIVERSITY ? (
                                    <CustomText type="secondary">
                                      Institucion: {appointment.UNIVERSITY}
                                    </CustomText>
                                  ) : null}
                                  {appointment.NOTES ? (
                                    <CustomText>{appointment.NOTES}</CustomText>
                                  ) : null}
                                </DetailBlock>
                              }
                            />
                          </CustomListItem>
                        )}
                      />
                    </CustomCard>
                  </CustomSpace>
                </CustomCol>
              </CustomRow>

              <CustomCard>
                <CustomTitle level={4} style={{ marginTop: 0 }}>
                  Proximas citas
                </CustomTitle>
                <CustomDivider />
                <CustomList
                  dataSource={upcomingAppointments.slice(0, 5)}
                  locale={{ emptyText: 'No tienes citas proximas.' }}
                  renderItem={(appointment) => (
                    <CustomListItem key={appointment.APPOINTMENT_ID}>
                      <CustomListItemMeta
                        title={appointment.TITLE}
                        description={
                          <DetailBlock>
                            <CustomText>
                              {formatAppointmentDate(appointment.START_AT)}
                            </CustomText>
                            {appointment.LOCATION ? (
                              <CustomText type="secondary">
                                Lugar: {appointment.LOCATION}
                              </CustomText>
                            ) : null}
                          </DetailBlock>
                        }
                      />
                      <CustomTag color={statusMeta[appointment.STATUS].color}>
                        {statusMeta[appointment.STATUS].label}
                      </CustomTag>
                    </CustomListItem>
                  )}
                />
              </CustomCard>
            </CustomSpace>
          }
        >
          <CustomCard>
            <CustomResult
              status="info"
              title="Aun no tienes citas registradas"
              subTitle="Cuando el equipo programe una reunion o seguimiento, aparecera aqui."
            />
          </CustomCard>
        </ConditionalRender>
      </CustomSpace>
    </CustomSpin>
  )
}

const ConditionalRender: React.FC<
  React.PropsWithChildren<{
    condition: boolean
    fallback: React.ReactNode
  }>
> = ({ condition, children, fallback }) => {
  return <>{condition ? children : fallback}</>
}

export default Page
