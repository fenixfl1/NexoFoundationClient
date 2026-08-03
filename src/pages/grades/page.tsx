import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FilePdfOutlined, PlusOutlined } from '@ant-design/icons'
import SmartTable from 'src/components/SmartTable'
import CustomCard from 'src/components/custom/CustomCard'
import CustomButton from 'src/components/custom/CustomButton'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import { CustomText, CustomTitle } from 'src/components/custom/CustomParagraph'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomTag from 'src/components/custom/CustomTag'
import CustomTooltip from 'src/components/custom/CustomTooltip'
import CustomAlert from 'src/components/custom/CustomAlert'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomBadge from 'src/components/custom/CustomBadge'
import CustomDrawer from 'src/components/custom/CustomDrawer'
import ConditionalComponent from 'src/components/ConditionalComponent'
import { ColumnsType } from 'antd/lib/table'
import { useGradesStore } from 'src/store/grades.store'
import { useGetTermPaginationMutation } from 'src/services/grades/useGetTermPaginationMutation'
import { useCreateTermMutation } from 'src/services/grades/useCreateTermMutation'
import { useUpdateTermMutation } from 'src/services/grades/useUpdateTermMutation'
import { useGetTermQuery } from 'src/services/grades/useGetTermQuery'
import { CourseGrade, Term } from 'src/services/grades/grades.types'
import useDebounce from 'src/hooks/use-debounce'
import { API_PATH_GET_TERM } from 'src/constants/routes'
import { getRequest } from 'src/services/api'
import { getSessionInfo } from 'src/lib/session'
import { ROLE_STUDENT_ID } from 'src/utils/role-path'
import { useGetStudentPaginationMutation } from 'src/services/students/useGetStudentPaginationMutation'
import { useStudentStore } from 'src/store/students.store'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import TermForm, { FormValues } from './components/TermForm'
import { Form } from 'antd'
import CustomSelect from 'src/components/custom/CustomSelect'

const initialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const toNumber = (value: unknown): number => Number(value ?? 0)

const formatDecimal = (value: unknown): string => toNumber(value).toFixed(2)

const GradesPage: React.FC = () => {
  const [form] = Form.useForm()
  const [detailId, setDetailId] = useState<number>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Term>()
  const [initialForm, setInitialForm] = useState<FormValues>()
  const [searchKey, setSearchKey] = useState('')
  const debounce = useDebounce(searchKey)
  const { roleId } = getSessionInfo()
  const isStudentRole = String(roleId) === ROLE_STUDENT_ID

  const [studentSearch, setStudentSearch] = useState('')
  const debounceStudent = useDebounce(studentSearch)

  const { terms, metadata } = useGradesStore()
  const { mutate: getTerms, isPending } = useGetTermPaginationMutation()
  const { mutateAsync: createTerm, isPending: isCreatePending } =
    useCreateTermMutation(handleRefresh)
  const { mutateAsync: updateTerm, isPending: isUpdatePending } =
    useUpdateTermMutation(handleRefresh)

  const { data: detail, isFetching: loadingDetail } = useGetTermQuery(detailId)
  const { students } = useStudentStore()
  const { mutate: getStudents, isPending: isGetStudentsPending } =
    useGetStudentPaginationMutation()

  const loading =
    isPending || isCreatePending || isUpdatePending || isGetStudentsPending

  const studentOptions = useMemo(() => {
    const base = students.map((s) => ({
      value: s.STUDENT_ID,
      label: `${s.NAME} ${s.LAST_NAME} - ${s.UNIVERSITY}`,
    }))

    if (
      editing?.STUDENT_ID &&
      !base.some((opt) => opt.value === editing.STUDENT_ID)
    ) {
      base.unshift({
        value: editing.STUDENT_ID,
        label: `Becario #${editing.STUDENT_ID}`,
      })
    }

    return base
  }, [students, editing?.STUDENT_ID])

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

      getTerms({ page, size, condition })
    },
    [debounce, form, getTerms, metadata?.currentPage, metadata?.pageSize]
  )

  useEffect(handleSearch, [handleSearch])

  const fetchStudents = useCallback(() => {
    if (!modalOpen || isStudentRole) return

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

    getStudents({ page: 1, size: 20, condition })
  }, [debounceStudent, getStudents, isStudentRole, modalOpen])

  useEffect(fetchStudents, [fetchStudents])

  async function handleRefresh() {
    await handleSearch()
    setModalOpen(false)
    setEditing(undefined)
    setInitialForm(undefined)
  }

  const columns: ColumnsType<Term> = useMemo(
    () => [
      {
        dataIndex: 'PERIOD',
        key: 'PERIOD',
        title: 'Periodo',
        render: (value: string, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{value}</CustomText>
            <CustomText type="secondary">
              {record.NAME} {record.LAST_NAME}
            </CustomText>
          </CustomSpace>
        ),
      },
      {
        dataIndex: 'TERM_INDEX',
        key: 'TERM_INDEX',
        title: 'Indice',
        render: (value) => (
          <CustomTag
            color={
              toNumber(value) >= 80
                ? 'green'
                : toNumber(value) >= 70
                  ? 'gold'
                  : 'red'
            }
          >
            {formatDecimal(value)}
          </CustomTag>
        ),
      },
      {
        dataIndex: 'TOTAL_CREDITS',
        key: 'TOTAL_CREDITS',
        title: 'Creditos',
      },
      {
        dataIndex: 'UNIVERSITY',
        key: 'UNIVERSITY',
        title: 'Universidad',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <span>{record.UNIVERSITY ?? '-'}</span>
            <CustomText type="secondary">{record.CAREER ?? ''}</CustomText>
          </CustomSpace>
        ),
      },
      {
        dataIndex: 'CAPTURE_FILE_NAME',
        key: 'CAPTURE_FILE_NAME',
        title: 'Captura',
        render: (value) =>
          value ? (
            <CustomSpace size={6}>
              <FilePdfOutlined />
              <span>{value}</span>
            </CustomSpace>
          ) : (
            'No adjunta'
          ),
      },
      {
        dataIndex: 'actions',
        key: 'actions',
        title: 'Acciones',
        align: 'center',
        render: (_, record) => (
          <CustomSpace size={8}>
            <CustomTooltip title="Ver detalle">
              <CustomButton
                type="link"
                onClick={() => setDetailId(record.TERM_ID)}
              >
                Ver
              </CustomButton>
            </CustomTooltip>
            {!isStudentRole ? (
              <CustomTooltip title="Editar">
                <CustomButton
                  type="link"
                  onClick={async () => {
                    setEditing(record)
                    const courses = await fetchCourses(record.TERM_ID)
                    setInitialForm({
                      ...record,
                      COURSES: courses,
                    })
                    setModalOpen(true)
                  }}
                >
                  Editar
                </CustomButton>
              </CustomTooltip>
            ) : null}
          </CustomSpace>
        ),
      },
    ],
    [isStudentRole]
  )

  const detailCourses = detail?.COURSES ?? []

  const filter = (
    <CustomRow gutter={[8, 8]}>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Estado'}
          labelCol={{ span: 24 }}
          name={['FILTER', 'STATE__IN']}
        >
          <CustomSelect
            mode={'multiple'}
            options={[
              { label: 'Activos', value: 'A' },
              { label: 'Inactivos', value: 'I' },
            ]}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Universidad'}
          name={['FILTER', 'UNIVERSITY__LIKE']}
          labelCol={{ span: 24 }}
        >
          <CustomInput placeholder="Filtrar por universidad" />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Periodo'}
          name={['FILTER', 'PERIOD__LIKE']}
          labelCol={{ span: 24 }}
        >
          <CustomInput placeholder="Filtrar por periodo" />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  return (
    <CustomSpin spinning={loading}>
      <CustomCard>
        <CustomRow justify="space-between" align="middle">
          <CustomCol>
            <CustomTitle level={4}>Calificaciones por cuatrimestre</CustomTitle>
            <CustomText type="secondary">
              Sube capturas, materias y calculo automático del indice.
            </CustomText>
          </CustomCol>
          <CustomCol>
            <ConditionalComponent condition={isStudentRole}>
              <CustomButton
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  form.resetFields()
                  setEditing(undefined)
                  setModalOpen(true)
                }}
              >
                Nuevo cuatrimestre
              </CustomButton>
            </ConditionalComponent>
          </CustomCol>
        </CustomRow>
        <CustomDivider />

        <SmartTable
          exportable
          form={form}
          rowKey="TERM_ID"
          dataSource={terms}
          columns={columns}
          filter={filter}
          initialFilter={initialFilter}
          metadata={metadata}
          searchPlaceholder="Buscar por estudiante, cedula o periodo..."
          onSearch={setSearchKey}
          onChange={handleSearch}
          showActions={false}
          expandable={{
            expandedRowRender: (record) => (
              <CoursesPreview termId={record.TERM_ID} />
            ),
            rowExpandable: () => true,
          }}
        />
      </CustomCard>

      <TermForm
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        isStudentRole={isStudentRole}
        studentOptions={studentOptions}
        onStudentSearch={setStudentSearch}
        initialValues={initialForm}
        onSubmit={async (values) => {
          if (editing) {
            await updateTerm({ ...values, TERM_ID: editing.TERM_ID })
          } else {
            await createTerm(values)
          }
        }}
      />

      <CustomDrawer
        width={520}
        title="Detalle del cuatrimestre"
        open={!!detailId}
        onClose={() => setDetailId(undefined)}
      >
        <CustomSpin spinning={loadingDetail}>
          {detail ? (
            <CustomSpace
              direction="vertical"
              size={12}
              style={{ width: '100%' }}
            >
              <CustomText strong>
                {detail.PERIOD} - {detail.UNIVERSITY} {detail.CAREER}
              </CustomText>
              <CustomSpace size={12}>
                <CustomTag color="geekblue">
                  Indice {formatDecimal(detail.TERM_INDEX)}
                </CustomTag>
                <CustomTag color="purple">
                  Creditos {toNumber(detail.TOTAL_CREDITS)}
                </CustomTag>
              </CustomSpace>
              {detail.CAPTURE_BASE64 ? (
                <CustomAlert
                  type="info"
                  message={
                    <a
                      href={`data:${detail.CAPTURE_MIME_TYPE};base64,${detail.CAPTURE_BASE64}`}
                      download={detail.CAPTURE_FILE_NAME || 'captura.pdf'}
                    >
                      Descargar captura
                    </a>
                  }
                />
              ) : null}
              <CustomDivider>Materias</CustomDivider>
              {detailCourses.length ? (
                <CustomSpace
                  direction="vertical"
                  size={6}
                  style={{ width: '100%' }}
                >
                  {detailCourses.map((course) => (
                    <CustomCard
                      key={course.COURSE_GRADE_ID || course.COURSE_NAME}
                    >
                      <CustomRow justify="space-between" align="middle">
                        <CustomCol>
                          <CustomText strong>{course.COURSE_NAME}</CustomText>
                          <br />
                          <CustomText type="secondary">
                            {toNumber(course.CREDITS)} creditos
                          </CustomText>
                        </CustomCol>
                        <CustomCol>
                          <CustomBadge
                            color={
                              course.STATUS === 'passed'
                                ? 'green'
                                : course.STATUS === 'failed'
                                  ? 'red'
                                  : 'gold'
                            }
                            text={`Nota ${toNumber(course.GRADE)}`}
                          />
                        </CustomCol>
                      </CustomRow>
                    </CustomCard>
                  ))}
                </CustomSpace>
              ) : (
                <CustomAlert
                  type="warning"
                  message="No hay materias registradas en este cuatrimestre."
                  showIcon
                />
              )}
            </CustomSpace>
          ) : (
            <CustomAlert
              type="info"
              message="Selecciona un cuatrimestre para ver detalles."
            />
          )}
        </CustomSpin>
      </CustomDrawer>
    </CustomSpin>
  )

  async function fetchCourses(termId: number): Promise<CourseGrade[]> {
    const { data } = await getRequest<Term>(API_PATH_GET_TERM, termId)
    return data?.data?.COURSES ?? []
  }
}

const CoursesPreview: React.FC<{ termId: number }> = ({ termId }) => {
  const { data, isLoading } = useGetTermQuery(termId)

  if (isLoading) return <CustomText>Cargando materias...</CustomText>
  if (!data?.COURSES?.length)
    return <CustomText type="secondary">Sin materias cargadas.</CustomText>

  return (
    <CustomSpace direction="vertical" style={{ width: '100%' }}>
      {data.COURSES.map((course) => (
        <CustomSpace
          key={course.COURSE_GRADE_ID || course.COURSE_NAME}
          size={8}
        >
          <CustomTag color="blue">{course.COURSE_NAME}</CustomTag>
          <CustomText>
            {toNumber(course.CREDITS)} cr - {toNumber(course.GRADE)}
          </CustomText>
        </CustomSpace>
      ))}
    </CustomSpace>
  )
}

export default GradesPage
