import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import styled from 'styled-components'
import {
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LineChartOutlined,
  ReadOutlined,
} from '@ant-design/icons'
import CustomAlert from 'src/components/custom/CustomAlert'
import CustomCard from 'src/components/custom/CustomCard'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDescriptions from 'src/components/custom/CustomDescription'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomList from 'src/components/custom/CustomList'
import CustomListItem from 'src/components/custom/CustomListItem'
import CustomListItemMeta from 'src/components/custom/CustomListItemMeta'
import {
  CustomParagraph,
  CustomText,
  CustomTitle,
} from 'src/components/custom/CustomParagraph'
import CustomResult from 'src/components/custom/CustomResult'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTag from 'src/components/custom/CustomTag'
import CustomTimeline from 'src/components/custom/CustomTimeline'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import useDebounce from 'src/hooks/use-debounce'
import { getSessionInfo } from 'src/lib/session'
import {
  AppointmentStatus,
} from 'src/services/appointments/appointment.types'
import { useGetAppointmentPaginationMutation } from 'src/services/appointments/useGetAppointmentPaginationMutation'
import {
  FollowUpStatus,
} from 'src/services/follow-up/follow-up.types'
import { useGetFollowUpPaginationMutation } from 'src/services/follow-up/useGetFollowUpPaginationMutation'
import { CourseGrade } from 'src/services/grades/grades.types'
import { useGetTermPaginationMutation } from 'src/services/grades/useGetTermPaginationMutation'
import { useGetTermQuery } from 'src/services/grades/useGetTermQuery'
import {
  ScholarshipStatus,
  Student,
} from 'src/services/students/student.types'
import { useGetStudentPaginationMutation } from 'src/services/students/useGetStudentPaginationMutation'
import { useAppointmentStore } from 'src/store/appointment.store'
import { useFollowUpStore } from 'src/store/follow-up.store'
import { useGradesStore } from 'src/store/grades.store'
import { useStudentStore } from 'src/store/students.store'
import { AdvancedCondition } from 'src/types/general'
import formatter from 'src/utils/formatter'
import { ROLE_STUDENT_ID } from 'src/utils/role-path'

const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const HeroCard = styled(CustomCard)`
  border: 1px solid
    ${({ theme }) =>
      theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  background: ${({ theme }) =>
    theme.isDark
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(79, 140, 255, 0.08))'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(79, 140, 255, 0.08))'};
`

const PanelCard = styled(CustomCard)`
  height: 100%;
  border: 1px solid
    ${({ theme }) =>
      theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  background: ${({ theme }) =>
    theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.86)'};
`

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
`

const MetricCard = styled(PanelCard)`
  padding: 18px 20px;
`

const MetricLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) =>
    theme.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.58)'};
  font-size: 13px;
`

const MetricValue = styled.div`
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
`

const MetricHint = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) =>
    theme.isDark ? 'rgba(255, 255, 255, 0.66)' : 'rgba(0, 0, 0, 0.58)'};
`

const AlertStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const CourseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const CourseRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: ${({ theme }) =>
    theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'};
`

const EmptyPanel = styled.div`
  min-height: 220px;
  display: grid;
  place-items: center;
`

type AlertLevel = 'info' | 'success' | 'warning' | 'error'

interface AcademicAlert {
  key: string
  type: AlertLevel
  title: string
  description: string
}

const scholarshipStatusMeta: Record<
  ScholarshipStatus,
  { label: string; color: string }
> = {
  [ScholarshipStatus.PENDING]: {
    label: 'Pendiente',
    color: 'gold',
  },
  [ScholarshipStatus.ACTIVE]: {
    label: 'Activa',
    color: 'green',
  },
  [ScholarshipStatus.SUSPENDED]: {
    label: 'Suspendida',
    color: 'volcano',
  },
  [ScholarshipStatus.COMPLETED]: {
    label: 'Completada',
    color: 'blue',
  },
  [ScholarshipStatus.GRADUATED]: {
    label: 'Graduada',
    color: 'purple',
  },
}

const appointmentStatusMeta: Record<
  AppointmentStatus,
  { label: string; color: string }
> = {
  scheduled: { label: 'Programada', color: 'geekblue' },
  completed: { label: 'Completada', color: 'green' },
  cancelled: { label: 'Cancelada', color: 'red' },
}

const followUpStatusMeta: Record<
  FollowUpStatus,
  { label: string; color: string }
> = {
  open: { label: 'Abierto', color: 'blue' },
  completed: { label: 'Completado', color: 'green' },
  cancelled: { label: 'Cancelado', color: 'red' },
}

const courseStatusMeta: Record<string, { label: string; color: string }> = {
  passed: { label: 'Aprobada', color: 'green' },
  failed: { label: 'Reprobada', color: 'red' },
  in_progress: { label: 'En curso', color: 'gold' },
}

const formatDate = (value?: string | null) =>
  value ? formatter({ value, format: 'date' }) : 'N/A'

const formatDateTime = (value?: string | null) =>
  value ? formatter({ value, format: 'datetime' }) : 'N/A'

const Page: React.FC = () => {
  const { roleId, personId } = getSessionInfo()
  const isStudentRole = String(roleId) === ROLE_STUDENT_ID

  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<number>()
  const [selectedStudent, setSelectedStudent] = useState<Student>()
  const debounceStudent = useDebounce(studentSearch)
  const [errorHandler] = useErrorHandler()

  const { students } = useStudentStore()
  const { terms } = useGradesStore()
  const { followUps } = useFollowUpStore()
  const { appointments } = useAppointmentStore()

  const { mutate: getStudents, isPending: isStudentsPending } =
    useGetStudentPaginationMutation()
  const { mutate: getTerms, isPending: isTermsPending } =
    useGetTermPaginationMutation()
  const { mutate: getFollowUps, isPending: isFollowUpsPending } =
    useGetFollowUpPaginationMutation()
  const { mutate: getAppointments, isPending: isAppointmentsPending } =
    useGetAppointmentPaginationMutation()

  const studentOptions = useMemo(() => {
    const options = students.map((student) => ({
      value: student.STUDENT_ID,
      label: `${student.NAME} ${student.LAST_NAME} · ${student.UNIVERSITY}`,
    }))

    if (
      selectedStudent &&
      !options.some((option) => option.value === selectedStudent.STUDENT_ID)
    ) {
      options.unshift({
        value: selectedStudent.STUDENT_ID,
        label: `${selectedStudent.NAME} ${selectedStudent.LAST_NAME} · ${selectedStudent.UNIVERSITY}`,
      })
    }

    return options
  }, [selectedStudent, students])

  const fetchStudents = useCallback(() => {
    try {
      const condition: AdvancedCondition[] = [
        {
          field: 'STATE',
          operator: '=',
          value: 'A',
        },
      ]

      if (isStudentRole && personId) {
        condition.push({
          field: 'PERSON_ID',
          operator: '=',
          value: Number(personId),
        })
      }

      if (!isStudentRole && debounceStudent) {
        condition.push({
          field: 'FILTER',
          operator: 'LIKE',
          value: debounceStudent,
        })
      }

      getStudents({ page: 1, size: isStudentRole ? 1 : 20, condition })
    } catch (error) {
      errorHandler(error)
    }
  }, [debounceStudent, errorHandler, getStudents, isStudentRole, personId])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    if (!students.length) return

    if (isStudentRole) {
      setSelectedStudent(students[0])
      setSelectedStudentId(students[0].STUDENT_ID)
      return
    }

    if (!selectedStudentId) {
      setSelectedStudent(students[0])
      setSelectedStudentId(students[0].STUDENT_ID)
      return
    }

    const current = students.find(
      (student) => student.STUDENT_ID === selectedStudentId
    )

    if (current) {
      setSelectedStudent(current)
    }
  }, [isStudentRole, selectedStudentId, students])

  const fetchAcademicData = useCallback(() => {
    if (!selectedStudentId) return

    try {
      const baseCondition: AdvancedCondition[] = [
        {
          field: 'STUDENT_ID',
          operator: '=',
          value: selectedStudentId,
        },
      ]

      getTerms({
        page: 1,
        size: 100,
        condition: baseCondition,
      })

      getFollowUps({
        page: 1,
        size: 20,
        condition: [
          ...baseCondition,
          {
            field: 'STATE',
            operator: '=',
            value: 'A',
          },
        ],
      })

      getAppointments({
        page: 1,
        size: 20,
        condition: [
          ...baseCondition,
          {
            field: 'STATE',
            operator: '=',
            value: 'A',
          },
        ],
      })
    } catch (error) {
      errorHandler(error)
    }
  }, [
    errorHandler,
    getAppointments,
    getFollowUps,
    getTerms,
    selectedStudentId,
  ])

  useEffect(() => {
    fetchAcademicData()
  }, [fetchAcademicData])

  const sortedTerms = useMemo(
    () => [...terms].sort((a, b) => b.TERM_ID - a.TERM_ID),
    [terms]
  )

  const sortedFollowUps = useMemo(
    () =>
      [...followUps].sort(
        (a, b) =>
          dayjs(b.FOLLOW_UP_DATE).valueOf() - dayjs(a.FOLLOW_UP_DATE).valueOf()
      ),
    [followUps]
  )

  const upcomingAppointments = useMemo(
    () =>
      [...appointments]
        .filter(
          (appointment) =>
            appointment.STATUS === 'scheduled' &&
            dayjs(appointment.START_AT).isAfter(dayjs())
        )
        .sort(
          (a, b) =>
            dayjs(a.START_AT).valueOf() - dayjs(b.START_AT).valueOf()
        ),
    [appointments]
  )

  const latestTerm = sortedTerms[0]
  const bestTerm = useMemo(
    () =>
      [...sortedTerms].sort((a, b) => b.TERM_INDEX - a.TERM_INDEX)[0],
    [sortedTerms]
  )
  const lastFollowUp = sortedFollowUps[0]
  const nextAppointment = upcomingAppointments[0]

  const { data: latestTermDetail, isFetching: isLatestTermFetching } =
    useGetTermQuery(latestTerm?.TERM_ID)

  const loading =
    isStudentsPending ||
    isTermsPending ||
    isFollowUpsPending ||
    isAppointmentsPending ||
    isLatestTermFetching

  const summaryCards = useMemo(
    () => [
      {
        key: 'average',
        icon: <LineChartOutlined />,
        title: 'Índice acumulado',
        value: Number(selectedStudent?.ACADEMIC_AVERAGE ?? 0).toFixed(2),
        hint: 'Promedio ponderado actualizado',
      },
      {
        key: 'terms',
        icon: <BookOutlined />,
        title: 'Períodos cargados',
        value: sortedTerms.length,
        hint: latestTerm
          ? `Último período: ${latestTerm.PERIOD}`
          : 'Aún no se registran períodos',
      },
      {
        key: 'followups',
        icon: <ReadOutlined />,
        title: 'Seguimientos',
        value: sortedFollowUps.length,
        hint: lastFollowUp
          ? `Último: ${formatDate(lastFollowUp.FOLLOW_UP_DATE)}`
          : 'Sin seguimientos todavía',
      },
      {
        key: 'appointments',
        icon: <CalendarOutlined />,
        title: 'Próxima cita',
        value: nextAppointment
          ? formatDate(nextAppointment.START_AT as string)
          : 'Pendiente',
        hint: nextAppointment
          ? dayjs(nextAppointment.START_AT).format('hh:mm A')
          : 'No hay citas futuras agendadas',
      },
    ],
    [lastFollowUp, latestTerm, nextAppointment, selectedStudent, sortedFollowUps.length, sortedTerms.length]
  )

  const alerts = useMemo<AcademicAlert[]>(() => {
    const items: AcademicAlert[] = []

    if (!selectedStudent) {
      return items
    }

    const average = Number(selectedStudent.ACADEMIC_AVERAGE ?? 0)

    if (!sortedTerms.length) {
      items.push({
        key: 'missing_terms',
        type: 'warning',
        title: 'Sin períodos académicos cargados',
        description:
          'Aún no se han registrado calificaciones por período para este becario.',
      })
    } else if (average < 70) {
      items.push({
        key: 'average_risk',
        type: 'error',
        title: 'Índice académico en riesgo',
        description:
          'El promedio acumulado está por debajo de 70. Conviene revisar el plan de acompañamiento.',
      })
    } else if (average < 80) {
      items.push({
        key: 'average_attention',
        type: 'warning',
        title: 'Índice académico bajo observación',
        description:
          'El promedio acumulado está por debajo de 80 y requiere seguimiento cercano.',
      })
    } else {
      items.push({
        key: 'average_ok',
        type: 'success',
        title: 'Desempeño académico estable',
        description:
          'El promedio acumulado se encuentra en un rango saludable para la beca.',
      })
    }

    if (!lastFollowUp) {
      items.push({
        key: 'follow_up_missing',
        type: 'info',
        title: 'Sin seguimiento registrado',
        description:
          'Todavía no hay reuniones o notas de seguimiento académico registradas.',
      })
    } else if (
      dayjs(lastFollowUp.FOLLOW_UP_DATE).isBefore(dayjs().subtract(45, 'day'))
    ) {
      items.push({
        key: 'follow_up_stale',
        type: 'warning',
        title: 'Seguimiento desactualizado',
        description:
          'Han pasado más de 45 días desde el último seguimiento registrado.',
      })
    }

    if (!nextAppointment) {
      items.push({
        key: 'appointment_missing',
        type: 'info',
        title: 'Sin próxima cita programada',
        description:
          'No hay citas académicas futuras registradas para este becario.',
      })
    }

    const coursesAtRisk =
      latestTermDetail?.COURSES?.filter(
        (course) =>
          course.STATUS === 'failed' ||
          Number(course.GRADE) < 70
      ) ?? []

    if (coursesAtRisk.length) {
      items.push({
        key: 'courses_risk',
        type: 'warning',
        title: 'Materias con alerta académica',
        description: `El último período contiene ${coursesAtRisk.length} materia(s) con nota baja o reprobada.`,
      })
    }

    return items
  }, [lastFollowUp, latestTermDetail?.COURSES, nextAppointment, selectedStudent, sortedTerms.length])

  const studentInfoItems = useMemo(
    () => [
      {
        key: 'document',
        label: 'Documento',
        children: selectedStudent?.IDENTITY_DOCUMENT
          ? formatter({
              value: selectedStudent.IDENTITY_DOCUMENT,
              format: 'document',
            })
          : 'N/A',
      },
      {
        key: 'university',
        label: 'Institución',
        children: selectedStudent?.UNIVERSITY || 'Pendiente de asignar',
      },
      {
        key: 'career',
        label: 'Carrera',
        children: selectedStudent?.CAREER || 'Por definir',
      },
      {
        key: 'cohort',
        label: 'Cohorte',
        children: selectedStudent?.COHORT || 'N/A',
      },
      {
        key: 'campus',
        label: 'Campus',
        children: selectedStudent?.CAMPUS || 'N/A',
      },
      {
        key: 'status',
        label: 'Estado de beca',
        children: selectedStudent?.SCHOLARSHIP_STATUS ? (
          <CustomTag
            color={
              scholarshipStatusMeta[selectedStudent.SCHOLARSHIP_STATUS]?.color as never
            }
          >
            {scholarshipStatusMeta[selectedStudent.SCHOLARSHIP_STATUS]?.label}
          </CustomTag>
        ) : (
          'N/A'
        ),
      },
    ],
    [selectedStudent]
  )

  const followUpTimelineItems = useMemo(
    () =>
      sortedFollowUps.slice(0, 5).map((followUp) => ({
        color: followUpStatusMeta[followUp.STATUS]?.color,
        label: formatDate(followUp.FOLLOW_UP_DATE),
        children: (
          <CustomSpace direction="vertical" size={2}>
            <CustomText strong>{followUp.SUMMARY}</CustomText>
            <CustomText type="secondary">
              {followUpStatusMeta[followUp.STATUS]?.label}
            </CustomText>
            {followUp.NEXT_APPOINTMENT ? (
              <CustomText type="secondary">
                Próxima cita sugerida: {formatDateTime(followUp.NEXT_APPOINTMENT)}
              </CustomText>
            ) : null}
          </CustomSpace>
        ),
      })),
    [sortedFollowUps]
  )

  const latestCourses = latestTermDetail?.COURSES ?? []

  return (
    <CustomSpin spinning={loading}>
      <PageWrap>
        <HeroCard>
          <CustomRow gutter={[16, 16]} justify="space-between" align="middle">
            <CustomCol xs={24} xl={16}>
              <CustomSpace direction="vertical" size={6}>
                <CustomText type="secondary">
                  {isStudentRole ? 'Tu panorama académico' : 'Consulta académica'}
                </CustomText>
                <CustomTitle level={3} style={{ margin: 0 }}>
                  {selectedStudent
                    ? `${selectedStudent.NAME} ${selectedStudent.LAST_NAME}`
                    : 'Información académica'}
                </CustomTitle>
                <CustomParagraph type="secondary" style={{ marginBottom: 0 }}>
                  Consolida calificaciones, índice acumulado, citas y
                  seguimientos en una sola vista.
                </CustomParagraph>
              </CustomSpace>
            </CustomCol>

            {!isStudentRole ? (
              <CustomCol xs={24} xl={8}>
                <CustomSpace direction="vertical" size={6} style={{ width: '100%' }}>
                  <CustomText strong>Seleccionar becario</CustomText>
                  <CustomSelect
                    showSearch
                    filterOption={false}
                    value={selectedStudentId}
                    placeholder="Buscar por nombre, documento o institución"
                    options={studentOptions}
                    onSearch={setStudentSearch}
                    onChange={(value) => {
                      if (!value) {
                        setSelectedStudent(undefined)
                        setSelectedStudentId(undefined)
                        return
                      }

                      const student = students.find(
                        (item) => item.STUDENT_ID === Number(value)
                      )
                      setSelectedStudentId(Number(value))
                      if (student) setSelectedStudent(student)
                    }}
                  />
                </CustomSpace>
              </CustomCol>
            ) : null}
          </CustomRow>

          {selectedStudent ? (
            <>
              <CustomDivider />
              <CustomDescriptions
                bordered={false}
                column={{ xs: 1, sm: 2, lg: 3 }}
                items={studentInfoItems}
              />
            </>
          ) : null}
        </HeroCard>

        {!selectedStudent && !loading ? (
          <CustomResult
            status="info"
            title="Sin becario seleccionado"
            subTitle="Selecciona un becario para consultar su avance académico."
          />
        ) : null}

        {selectedStudent ? (
          <>
            <MetricGrid>
              {summaryCards.map((card) => (
                <MetricCard key={card.key}>
                  <MetricLabel>
                    {card.icon}
                    {card.title}
                  </MetricLabel>
                  <MetricValue>{card.value}</MetricValue>
                  <MetricHint>{card.hint}</MetricHint>
                </MetricCard>
              ))}
            </MetricGrid>

            <CustomRow gutter={[16, 16]} align="stretch">
              <CustomCol xs={24} xl={14}>
                <PanelCard>
                  <CustomTitle level={4}>Estado actual</CustomTitle>
                  <AlertStack>
                    {alerts.map((alert) => (
                      <CustomAlert
                        key={alert.key}
                        type={alert.type}
                        showIcon
                        message={alert.title}
                        description={alert.description}
                      />
                    ))}
                  </AlertStack>
                </PanelCard>
              </CustomCol>

              <CustomCol xs={24} xl={10}>
                <PanelCard>
                  <CustomTitle level={4}>Próxima interacción</CustomTitle>
                  {nextAppointment ? (
                    <CustomSpace direction="vertical" size={10}>
                      <CustomTag
                        color={
                          appointmentStatusMeta[nextAppointment.STATUS]
                            ?.color as never
                        }
                      >
                        {appointmentStatusMeta[nextAppointment.STATUS]?.label}
                      </CustomTag>
                      <CustomTitle level={5} style={{ margin: 0 }}>
                        {nextAppointment.TITLE}
                      </CustomTitle>
                      <CustomText>
                        {formatDateTime(nextAppointment.START_AT as string)}
                      </CustomText>
                      {nextAppointment.LOCATION ? (
                        <CustomText type="secondary">
                          Lugar: {nextAppointment.LOCATION}
                        </CustomText>
                      ) : null}
                      {nextAppointment.DESCRIPTION ? (
                        <CustomParagraph style={{ marginBottom: 0 }}>
                          {nextAppointment.DESCRIPTION}
                        </CustomParagraph>
                      ) : null}
                    </CustomSpace>
                  ) : (
                    <EmptyPanel>
                      <CustomAlert
                        type="info"
                        showIcon
                        message="No hay citas académicas futuras."
                      />
                    </EmptyPanel>
                  )}
                </PanelCard>
              </CustomCol>
            </CustomRow>

            <CustomRow gutter={[16, 16]} align="stretch">
              <CustomCol xs={24} xl={14}>
                <PanelCard>
                  <CustomTitle level={4}>Historial de períodos</CustomTitle>
                  {sortedTerms.length ? (
                    <CustomList
                      dataSource={sortedTerms}
                      renderItem={(term) => (
                        <CustomListItem key={term.TERM_ID}>
                          <CustomListItemMeta
                            title={
                              <CustomSpace size={8} wrap>
                                <CustomText strong>{term.PERIOD}</CustomText>
                                <CustomTag
                                  color={
                                    term.TERM_INDEX >= 80
                                      ? 'green'
                                      : term.TERM_INDEX >= 70
                                        ? 'gold'
                                        : 'red'
                                  }
                                >
                                  Índice {Number(term.TERM_INDEX).toFixed(2)}
                                </CustomTag>
                              </CustomSpace>
                            }
                            description={
                              <CustomSpace direction="vertical" size={0}>
                                <CustomText type="secondary">
                                  {term.UNIVERSITY || selectedStudent.UNIVERSITY} ·{' '}
                                  {term.CAREER || selectedStudent.CAREER}
                                </CustomText>
                                <CustomText type="secondary">
                                  Créditos: {term.TOTAL_CREDITS}
                                </CustomText>
                              </CustomSpace>
                            }
                          />
                        </CustomListItem>
                      )}
                    />
                  ) : (
                    <EmptyPanel>
                      <CustomAlert
                        type="warning"
                        showIcon
                        message="No hay períodos académicos registrados."
                      />
                    </EmptyPanel>
                  )}
                </PanelCard>
              </CustomCol>

              <CustomCol xs={24} xl={10}>
                <PanelCard>
                  <CustomTitle level={4}>Seguimiento reciente</CustomTitle>
                  {followUpTimelineItems.length ? (
                    <CustomTimeline mode="left" items={followUpTimelineItems} />
                  ) : (
                    <EmptyPanel>
                      <CustomAlert
                        type="info"
                        showIcon
                        message="No hay seguimientos registrados todavía."
                      />
                    </EmptyPanel>
                  )}
                </PanelCard>
              </CustomCol>
            </CustomRow>

            <CustomRow gutter={[16, 16]} align="stretch">
              <CustomCol xs={24} xl={14}>
                <PanelCard>
                  <CustomTitle level={4}>Detalle del último período</CustomTitle>
                  {latestTerm ? (
                    <CustomSpace direction="vertical" size={14} style={{ width: '100%' }}>
                      <CustomSpace size={8} wrap>
                        <CustomTag color="geekblue">{latestTerm.PERIOD}</CustomTag>
                        <CustomTag color="purple">
                          Créditos {latestTerm.TOTAL_CREDITS}
                        </CustomTag>
                        <CustomTag
                          color={
                            latestTerm.TERM_INDEX >= 80
                              ? 'green'
                              : latestTerm.TERM_INDEX >= 70
                                ? 'gold'
                                : 'red'
                          }
                        >
                          Índice {Number(latestTerm.TERM_INDEX).toFixed(2)}
                        </CustomTag>
                      </CustomSpace>

                      {latestCourses.length ? (
                        <CourseList>
                          {latestCourses.map((course: CourseGrade) => (
                            <CourseRow
                              key={
                                course.COURSE_GRADE_ID || `${course.COURSE_NAME}-${course.GRADE}`
                              }
                            >
                              <CustomSpace direction="vertical" size={0}>
                                <CustomText strong>{course.COURSE_NAME}</CustomText>
                                <CustomText type="secondary">
                                  {course.CREDITS} créditos · Nota {course.GRADE}
                                </CustomText>
                              </CustomSpace>
                              <CustomTag
                                color={
                                  courseStatusMeta[course.STATUS || 'in_progress']
                                    ?.color as never
                                }
                              >
                                {
                                  courseStatusMeta[course.STATUS || 'in_progress']
                                    ?.label
                                }
                              </CustomTag>
                            </CourseRow>
                          ))}
                        </CourseList>
                      ) : (
                        <CustomAlert
                          type="info"
                          showIcon
                          message="El período no tiene materias detalladas cargadas."
                        />
                      )}
                    </CustomSpace>
                  ) : (
                    <EmptyPanel>
                      <CustomAlert
                        type="info"
                        showIcon
                        message="No hay un período reciente para mostrar."
                      />
                    </EmptyPanel>
                  )}
                </PanelCard>
              </CustomCol>

              <CustomCol xs={24} xl={10}>
                <PanelCard>
                  <CustomTitle level={4}>Indicadores clave</CustomTitle>
                  <CustomSpace direction="vertical" size={12} style={{ width: '100%' }}>
                    <CustomAlert
                      type="success"
                      showIcon
                      icon={<CheckCircleOutlined />}
                      message={
                        bestTerm
                          ? `Mejor período: ${bestTerm.PERIOD}`
                          : 'Sin períodos evaluables'
                      }
                      description={
                        bestTerm
                          ? `Índice ${Number(bestTerm.TERM_INDEX).toFixed(2)} con ${bestTerm.TOTAL_CREDITS} créditos.`
                          : 'Cuando existan registros de calificaciones, se mostrará aquí el mejor desempeño.'
                      }
                    />
                    <CustomAlert
                      type="info"
                      showIcon
                      message="Último seguimiento"
                      description={
                        lastFollowUp
                          ? `${formatDate(lastFollowUp.FOLLOW_UP_DATE)} · ${lastFollowUp.SUMMARY}`
                          : 'No hay seguimiento registrado.'
                      }
                    />
                    <CustomAlert
                      type="warning"
                      showIcon
                      icon={<ExclamationCircleOutlined />}
                      message="Horas de servicio"
                      description={`Completadas ${selectedStudent.HOURS_COMPLETED || 0} de ${selectedStudent.HOURS_REQUIRED || 0} horas requeridas.`}
                    />
                  </CustomSpace>
                </PanelCard>
              </CustomCol>
            </CustomRow>
          </>
        ) : null}
      </PageWrap>
    </CustomSpin>
  )
}

export default Page
