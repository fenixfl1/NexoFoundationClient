import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import {
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import SmartTable from 'src/components/SmartTable'
import ConditionalComponent from 'src/components/ConditionalComponent'
import CustomBadge from 'src/components/custom/CustomBadge'
import CustomButton from 'src/components/custom/CustomButton'
import CustomCard from 'src/components/custom/CustomCard'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import { CustomText, CustomTitle } from 'src/components/custom/CustomParagraph'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTag from 'src/components/custom/CustomTag'
import CustomTooltip from 'src/components/custom/CustomTooltip'
import useDebounce from 'src/hooks/use-debounce'
import { getSessionInfo } from 'src/lib/session'
import ActivityForm, { ActivityFormValues } from './components/ActivityForm'
import EnrollmentForm from './components/EnrollmentForm'
import { useCreateActivityMutation } from 'src/services/activities/useCreateActivityMutation'
import { useEnrollActivityMutation } from 'src/services/activities/useEnrollActivityMutation'
import { Activity } from 'src/services/activities/activity.types'
import { useGetActivityPaginationMutation } from 'src/services/activities/useGetActivityPaginationMutation'
import { useUpdateActivityMutation } from 'src/services/activities/useUpdateActivityMutation'
import { useUpdateParticipantMutation } from 'src/services/activities/useUpdateParticipantMutation'
import { useGetStudentPaginationMutation } from 'src/services/students/useGetStudentPaginationMutation'
import { useActivitiesStore } from 'src/store/activities.store'
import { useStudentStore } from 'src/store/students.store'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import formatter from 'src/utils/formatter'
import { ROLE_STUDENT_ID } from 'src/utils/role-path'

const statusTag: Record<string, { color: string; label: string }> = {
  planned: { color: 'blue', label: 'Planificada' },
  completed: { color: 'green', label: 'Completada' },
  cancelled: { color: 'red', label: 'Cancelada' },
}

const initialFilter = {
  FILTER: {
    STATUS__IN: ['planned', 'completed', 'cancelled'],
  },
}

const isActivityFull = (activity: Activity) =>
  typeof activity.CAPACITY === 'number' &&
  activity.CAPACITY > 0 &&
  Number(activity.ENROLLED ?? 0) >= activity.CAPACITY

const canEnrollInActivity = (activity: Activity, isStudentRole: boolean) => {
  if (activity.STATUS !== 'planned') return false
  if (isActivityFull(activity)) return false
  if (isStudentRole && activity.IS_ENROLLED) return false
  return true
}

const getEnrollTooltip = (activity: Activity, isStudentRole: boolean) => {
  if (activity.STATUS === 'completed') {
    return 'La actividad ya fue completada'
  }

  if (activity.STATUS === 'cancelled') {
    return 'La actividad esta cancelada'
  }

  if (isActivityFull(activity)) {
    return 'La actividad ya no tiene cupo disponible'
  }

  if (isStudentRole && activity.IS_ENROLLED) {
    return 'Ya estas inscrito'
  }

  return isStudentRole ? 'Inscribirme' : 'Inscribir becario'
}

const getCompletionTooltip = (activity: Activity) => {
  if (activity.STATUS === 'completed') {
    return 'La actividad ya esta completada'
  }

  if (activity.STATUS === 'cancelled') {
    return 'No se puede completar una actividad cancelada'
  }

  return 'Marcar completada'
}

const toDateTimeValue = (value?: string | null | { toISOString?: () => string }) => {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.toISOString?.() ?? null
}

const normalizePayload = (values: ActivityFormValues) => ({
  ...values,
  START_AT: toDateTimeValue(values.START_AT as never) as string,
  END_AT: toDateTimeValue(values.END_AT as never),
})

const ActivitiesPage: React.FC = () => {
  const [form] = Form.useForm()
  const { activities, metadata } = useActivitiesStore()
  const { students } = useStudentStore()
  const { roleId } = getSessionInfo()
  const isStudentRole = String(roleId) === ROLE_STUDENT_ID

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
  const [modalOpen, setModalOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [editing, setEditing] = useState<Activity>()
  const [selectedActivity, setSelectedActivity] = useState<Activity>()
  const [studentSearch, setStudentSearch] = useState('')
  const debounce = useDebounce(searchKey)
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
      students.map((student) => ({
        value: student.STUDENT_ID,
        label: `${student.NAME} ${student.LAST_NAME} - ${student.UNIVERSITY}`,
      })),
    [students]
  )

  const handleSearch = useCallback(
    (page = metadata?.currentPage, size = metadata?.pageSize) => {
      const { FILTER = initialFilter.FILTER } = form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          field: 'FILTER',
          operator: 'LIKE',
          value: debounce,
        })
      }

      getActivities({ page, size, condition })
    },
    [debounce, form, getActivities, metadata?.currentPage, metadata?.pageSize]
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
  }, [debounceStudent, enrollOpen, getStudents])

  async function handleRefresh() {
    await handleSearch()
    setModalOpen(false)
    setEnrollOpen(false)
    setEditing(undefined)
    setSelectedActivity(undefined)
  }

  const handleEnrollClick = useCallback(
    async (activity: Activity) => {
      if (!canEnrollInActivity(activity, isStudentRole)) return

      if (isStudentRole) {
        await enroll({ ACTIVITY_ID: activity.ACTIVITY_ID })
        return
      }

      setSelectedActivity(activity)
      setEnrollOpen(true)
    },
    [enroll, isStudentRole]
  )

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
        render: (value, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomBadge count={value ?? 0} showZero />
            <CustomText type="secondary">
              {record.CAPACITY ? `Cupo ${value ?? 0} / ${record.CAPACITY}` : 'Sin limite'}
            </CustomText>
          </CustomSpace>
        ),
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
        width: '8%',
        render: (_, record) => {
          const enrollDisabled = !canEnrollInActivity(record, isStudentRole)
          const completeDisabled = record.STATUS !== 'planned'

          return (
            <CustomSpace
              direction="horizontal"
              size={8}
              split={<CustomDivider style={{ margin: 0 }} />}
            >
              <ConditionalComponent condition={!isStudentRole}>
                <CustomTooltip title="Editar">
                  <CustomButton
                    icon={<EditOutlined />}
                    type="link"
                    onClick={() => {
                      setEditing(record)
                      setModalOpen(true)
                    }}
                  />
                </CustomTooltip>
              </ConditionalComponent>
              <CustomTooltip title={getEnrollTooltip(record, isStudentRole)}>
                <CustomButton
                  type="link"
                  disabled={enrollDisabled}
                  icon={<UserAddOutlined />}
                  onClick={() => handleEnrollClick(record)}
                />
              </CustomTooltip>
              <ConditionalComponent condition={!isStudentRole}>
                <CustomTooltip title={getCompletionTooltip(record)}>
                  <CustomButton
                    type="link"
                    disabled={completeDisabled}
                    icon={<FileTextOutlined />}
                    onClick={async () => {
                      await updateActivity({
                        ACTIVITY_ID: record.ACTIVITY_ID,
                        STATUS: 'completed',
                      } as never)
                    }}
                  />
                </CustomTooltip>
              </ConditionalComponent>
            </CustomSpace>
          )
        },
      },
    ],
    [handleEnrollClick, isStudentRole, updateActivity]
  )

  const filter = (
    <CustomRow gutter={[8, 8]}>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Estado'}
          name={['FILTER', 'STATUS__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar estado"
            options={Object.entries(statusTag).map(([value, item]) => ({
              value,
              label: item.label,
            }))}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Lugar'}
          name={['FILTER', 'LOCATION__LIKE']}
          labelCol={{ span: 24 }}
        >
          <CustomInput placeholder="Filtrar por lugar" />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  return (
    <CustomSpin spinning={loading}>
      <CustomCard>
        <CustomRow justify="space-between" align="middle">
          <CustomCol>
            <CustomTitle level={4}>Actividades y voluntariado</CustomTitle>
          </CustomCol>
          <ConditionalComponent condition={!isStudentRole}>
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
          </ConditionalComponent>
        </CustomRow>

        <CustomDivider />

        <SmartTable
          exportable
          form={form}
          rowKey="ACTIVITY_ID"
          dataSource={activities}
          columns={columns}
          filter={filter}
          initialFilter={initialFilter}
          metadata={metadata}
          searchPlaceholder="Buscar por titulo o lugar..."
          onSearch={setSearchKey}
          onChange={handleSearch}
          showActions={false}
          showStates={false}
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
            return
          }

          await createActivity(normalizePayload(values))
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
