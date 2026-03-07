import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ColumnsType } from 'antd/lib/table'
import {
  FileTextOutlined,
  PlusOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import SmartTable from 'src/components/SmartTable'
import CustomCard from 'src/components/custom/CustomCard'
import CustomButton from 'src/components/custom/CustomButton'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomSpace from 'src/components/custom/CustomSpace'
import { CustomText, CustomTitle } from 'src/components/custom/CustomParagraph'
import CustomTag from 'src/components/custom/CustomTag'
import CustomTooltip from 'src/components/custom/CustomTooltip'
import CustomSpin from 'src/components/custom/CustomSpin'
import { Activity } from 'src/services/activities/activity.types'
import { useActivitiesStore } from 'src/store/activities.store'
import { useGetActivityPaginationMutation } from 'src/services/activities/useGetActivityPaginationMutation'
import { useCreateActivityMutation } from 'src/services/activities/useCreateActivityMutation'
import { useUpdateActivityMutation } from 'src/services/activities/useUpdateActivityMutation'
import { useEnrollActivityMutation } from 'src/services/activities/useEnrollActivityMutation'
import { useUpdateParticipantMutation } from 'src/services/activities/useUpdateParticipantMutation'
import { useGetStudentPaginationMutation } from 'src/services/students/useGetStudentPaginationMutation'
import { useStudentStore } from 'src/store/students.store'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import formatter from 'src/utils/formatter'
import ActivityForm, { ActivityFormValues } from './components/ActivityForm'
import EnrollmentForm from './components/EnrollmentForm'
import CustomBadge from 'src/components/custom/CustomBadge'

const statusTag: Record<string, { color: string; label: string }> = {
  planned: { color: 'blue', label: 'Planificada' },
  completed: { color: 'green', label: 'Completada' },
  cancelled: { color: 'red', label: 'Cancelada' },
}

const ActivitiesPage: React.FC = () => {
  const { activities, metadata } = useActivitiesStore()
  const { students } = useStudentStore()

  const { mutate: getActivities, isPending } =
    useGetActivityPaginationMutation()
  const { mutateAsync: createActivity, isPending: isCreatePending } =
    useCreateActivityMutation(handleRefresh)
  const { mutateAsync: updateActivity, isPending: isUpdatePending } =
    useUpdateActivityMutation(handleRefresh)
  const { mutateAsync: enroll, isPending: isEnrollPending } =
    useEnrollActivityMutation(handleRefresh)
  const {
    mutateAsync: updateParticipant,
    isPending: isUpdateParticipantPending,
  } = useUpdateParticipantMutation(handleRefresh)

  const { mutate: getStudents, isPending: isStudentsPending } =
    useGetStudentPaginationMutation()

  const [searchKey, setSearchKey] = useState('')
  const debounce = useDebounce(searchKey)
  const [modalOpen, setModalOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [editing, setEditing] = useState<Activity>()
  const [selectedActivity, setSelectedActivity] = useState<Activity>()
  const [studentSearch, setStudentSearch] = useState('')
  const debounceStudent = useDebounce(studentSearch)

  const loading =
    isPending ||
    isCreatePending ||
    isUpdatePending ||
    isEnrollPending ||
    isStudentsPending ||
    isUpdateParticipantPending

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        value: s.STUDENT_ID,
        label: `${s.NAME} ${s.LAST_NAME} · ${s.UNIVERSITY}`,
      })),
    [students]
  )

  const handleSearch = useCallback(
    (page = metadata?.currentPage, size = metadata?.pageSize) => {
      const condition: AdvancedCondition[] = []
      if (debounce) {
        condition.push({
          field: 'FILTER',
          operator: 'LIKE',
          value: debounce,
        })
      }
      getActivities({ page, size, condition })
    },
    [debounce, getActivities, metadata?.currentPage, metadata?.pageSize]
  )

  useEffect(handleSearch, [handleSearch])

  useEffect(() => {
    if (!enrollOpen) return
    const condition: AdvancedCondition[] = [
      { field: 'STATE', operator: '=', value: 'A' },
    ]
    if (debounceStudent) {
      condition.push({
        field: 'FILTER',
        operator: 'LIKE',
        value: debounceStudent,
      })
    }
    getStudents({ page: 1, size: 50, condition })
  }, [enrollOpen, debounceStudent, getStudents])

  async function handleRefresh() {
    await handleSearch()
    setModalOpen(false)
    setEnrollOpen(false)
    setEditing(undefined)
    setSelectedActivity(undefined)
  }

  const columns: ColumnsType<Activity> = useMemo(
    () => [
      {
        dataIndex: 'TITLE',
        key: 'TITLE',
        title: 'Actividad',
        render: (value, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{value}</CustomText>
            <CustomText type="secondary">
              {record.LOCATION ?? 'Sin lugar'}
            </CustomText>
          </CustomSpace>
        ),
      },
      {
        dataIndex: 'START_AT',
        key: 'START_AT',
        title: 'Inicio',
        render: (value) => formatter({ value, format: 'datetime' }),
      },
      {
        dataIndex: 'HOURS',
        key: 'HOURS',
        title: 'Horas',
        render: (value) => <CustomTag color="geekblue">{value} h</CustomTag>,
      },
      {
        dataIndex: 'ENROLLED',
        key: 'ENROLLED',
        title: 'Inscritos',
        render: (value) => <CustomBadge count={value ?? 0} showZero />,
      },
      {
        dataIndex: 'STATUS',
        key: 'STATUS',
        title: 'Estado',
        render: (value) => (
          <CustomTag color={statusTag[value]?.color || 'default'}>
            {statusTag[value]?.label ?? value}
          </CustomTag>
        ),
      },
      {
        dataIndex: 'actions',
        key: 'actions',
        title: 'Acciones',
        align: 'center',
        render: (_, record) => (
          <CustomSpace size={8}>
            <CustomTooltip title="Editar">
              <CustomButton
                type="link"
                onClick={() => {
                  setEditing(record)
                  setModalOpen(true)
                }}
              >
                Editar
              </CustomButton>
            </CustomTooltip>
            <CustomTooltip title="Inscribir becario">
              <CustomButton
                type="link"
                icon={<UserAddOutlined />}
                onClick={() => {
                  setSelectedActivity(record)
                  setEnrollOpen(true)
                }}
              />
            </CustomTooltip>
            <CustomTooltip title="Marcar completada">
              <CustomButton
                type="link"
                icon={<FileTextOutlined />}
                onClick={async () => {
                  await updateActivity({
                    ACTIVITY_ID: record.ACTIVITY_ID,
                    STATUS: 'completed',
                  } as never)
                }}
              />
            </CustomTooltip>
          </CustomSpace>
        ),
      },
    ],
    [updateActivity]
  )

  return (
    <CustomSpin spinning={loading}>
      <CustomCard>
        <CustomRow justify="space-between" align="middle">
          <CustomCol>
            <CustomTitle level={4}>Actividades y voluntariado</CustomTitle>
            <CustomText type="secondary">
              Gestiona jornadas, inscribe becarios y acredita horas completadas.
            </CustomText>
          </CustomCol>
          <CustomCol>
            <CustomButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(undefined)
                setModalOpen(true)
              }}
            >
              Nueva actividad
            </CustomButton>
          </CustomCol>
        </CustomRow>

        <CustomDivider />

        <SmartTable
      exportable
          rowKey="ACTIVITY_ID"
          dataSource={activities}
          columns={columns}
          metadata={metadata}
          searchPlaceholder="Buscar por título o lugar..."
          onSearch={setSearchKey}
          onChange={handleSearch}
          showActions={false}
        />
      </CustomCard>

      <ActivityForm
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          if (editing) {
            await updateActivity({
              ...normalizePayload(values),
              ACTIVITY_ID: editing.ACTIVITY_ID,
            })
          } else {
            await createActivity(normalizePayload(values))
          }
        }}
      />

      <EnrollmentForm
        open={enrollOpen}
        title={
          selectedActivity
            ? `Inscribir en ${selectedActivity.TITLE}`
            : 'Inscribir becario'
        }
        studentsOptions={studentOptions}
        onSearchStudent={setStudentSearch}
        onClose={() => setEnrollOpen(false)}
        onSubmit={async ({ STUDENT_ID, HOURS_EARNED, COMPLETE_NOW }) => {
          if (!selectedActivity) return
          const participant = await enroll({
            ACTIVITY_ID: selectedActivity.ACTIVITY_ID,
            STUDENT_ID,
          })
          if (COMPLETE_NOW && participant?.PARTICIPANT_ID) {
            await updateParticipant({
              PARTICIPANT_ID: participant.PARTICIPANT_ID,
              STATUS: 'completed',
              HOURS_EARNED: HOURS_EARNED ?? selectedActivity.HOURS,
            })
          }
        }}
      />
    </CustomSpin>
  )
}

export default ActivitiesPage

const normalizePayload = (values: ActivityFormValues) => ({
  ...values,
  START_AT: values.START_AT ?? values.START_AT,
  END_AT: values.END_AT ?? values.END_AT,
})
