import React from 'react'
import styled from 'styled-components'
import { DownloadOutlined } from '@ant-design/icons'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import CustomDrawer from 'src/components/custom/CustomDrawer'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomAvatar from 'src/components/custom/CustomAvatar'
import CustomCollapse from 'src/components/custom/CustomCollapse'
import CustomTag from 'src/components/custom/CustomTag'
import CustomTable from 'src/components/custom/CustomTable'
import CustomButton from 'src/components/custom/CustomButton'
import CustomSpin from 'src/components/custom/CustomSpin'
import { ColumnsType } from 'antd/lib/table'
import { CustomText, CustomTitle } from 'src/components/custom/CustomParagraph'
import {
  Student,
  StudentCourseGrade,
  StudentActivitySummary,
  StudentDisbursementSummary,
  StudentDocumentSummary,
  StudentFollowUpSummary,
  StudentRequirementSummary,
  StudentRequestSummary,
  StudentScholarshipSummary,
  StudentTerm,
} from 'src/services/students/student.types'
import dayjs from 'dayjs'
import formatter from 'src/utils/formatter'
import { useGetCatalog } from 'src/hooks/use-get-catalog'
import { useGetStudentQuery } from 'src/services/students/useGetStudentQuery'

const HeaderCard = styled.div`
  background: ${({ theme }) =>
    theme.isDark ? theme.colorBgElevated : theme.colorBgContainer};
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius}px;
`

const SectionTitle = styled(CustomTitle)`
  margin-bottom: 0 !important;
`

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  margin-top: 15px;
`

const SummaryItem = styled.div`
  background: ${({ theme }) => theme.colorBgContainer};
  border: 1px solid ${({ theme }) => theme.colorBorder};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  padding: 12px;
`

type PdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number
  }
}

const formatDate = (value?: string) =>
  value ? dayjs(value).format('DD MMM YYYY') : 'N/A'

const formatDateTime = (value?: string) =>
  value ? dayjs(value).format('DD MMM YYYY HH:mm') : 'N/A'

const formatCurrency = (value?: number | string) =>
  formatter({ value: Number(value ?? 0), format: 'currency' })

interface StudentDrawerProps {
  open: boolean
  student?: Student
  onClose: () => void
  statusColors: (value: string) => {
    label: string
    color: string
  }
}

const StudentDrawer: React.FC<StudentDrawerProps> = ({
  open,
  student,
  onClose,
  statusColors,
}) => {
  const [universities] = useGetCatalog('ID_LIST_UNIVERSITIES')
  const [careers] = useGetCatalog('ID_LIST_CAREERS')
  const [cohorts] = useGetCatalog('ID_LIST_COHORTS')
  const [campuses] = useGetCatalog('ID_LIST_CAMPUSES')
  const [requestTypes] = useGetCatalog('ID_LIST_REQUEST_TYPES')
  const [requestStatuses] = useGetCatalog('ID_LIST_REQUEST_STATUS')
  const [documentTypes] = useGetCatalog('ID_LIST_DOCUMENT_TYPE')
  const { data: studentDetail, isFetching } = useGetStudentQuery(
    student?.STUDENT_ID,
    open
  )

  if (!student) {
    return (
      <CustomDrawer open={open} onClose={onClose} width={'48%'}>
        <CustomText type="secondary">
          Selecciona un becario para visualizar su expediente.
        </CustomText>
      </CustomDrawer>
    )
  }

  const detail = studentDetail ?? student
  const initials = `${detail.NAME.charAt(0)}${detail.LAST_NAME.charAt(0)}`
  const status = statusColors(detail.SCHOLARSHIP_STATUS) ?? {
    label: detail.SCHOLARSHIP_STATUS,
    color: 'blue',
  }
  const fullName = `${detail.NAME} ${detail.LAST_NAME}`
  const findLabel = (
    catalog: { VALUE: string; LABEL?: string }[],
    value?: string
  ) => catalog.find((item) => item.VALUE === value)?.LABEL ?? value ?? 'N/A'
  const university = findLabel(universities, detail.UNIVERSITY)
  const career = findLabel(careers, detail.CAREER)
  const cohort = findLabel(cohorts, detail.COHORT)
  const campus = findLabel(campuses, detail.CAMPUS)
  const birthDate = formatDate(detail.BIRTH_DATE)
  const createdAt = detail.CREATED_AT
    ? dayjs(detail.CREATED_AT).format('dddd D [de] MMMM [del] YYYY')
    : 'N/A'
  const lastFollowUp = detail.LAST_FOLLOW_UP
    ? formatDate(detail.LAST_FOLLOW_UP)
    : 'No registrado'
  const nextAppointment = detail.NEXT_APPOINTMENT
    ? formatDate(detail.NEXT_APPOINTMENT)
    : 'No programada'
  const serviceProgress =
    detail.HOURS_REQUIRED > 0
      ? Math.round((detail.HOURS_COMPLETED / detail.HOURS_REQUIRED) * 100)
      : 0
  const terms = detail.TERMS ?? []
  const documents = detail.DOCUMENTS ?? []
  const requirements = detail.REQUIREMENTS ?? []
  const requests = detail.REQUESTS ?? []
  const followUps = detail.FOLLOW_UPS ?? []
  const scholarships = detail.SCHOLARSHIPS ?? []
  const disbursements = detail.DISBURSEMENTS ?? []
  const activities = detail.ACTIVITIES ?? []
  const summary = detail.EXPEDIENT_SUMMARY

  const personalItems = [
    {
      key: 'registered',
      label: 'Fecha de registro',
      value: createdAt,
    },
    {
      key: 'code',
      label: 'Código',
      value: detail.STUDENT_ID,
    },
    {
      key: 'documentType',
      label: 'Tipo de documento',
      value: detail.DOCUMENT_TYPE ?? 'N/A',
    },
    {
      key: 'document',
      label: 'Doc. Identidad',
      value: formatter({
        value: detail.IDENTITY_DOCUMENT,
        format: 'document',
      }),
    },
    {
      key: 'birthDate',
      label: 'Fecha de nacimiento',
      value: birthDate,
    },
    {
      key: 'gender',
      label: 'Género',
      value: detail.GENDER ?? 'N/A',
    },
  ]

  const academicItems = [
    {
      key: 'university',
      label: 'Universidad',
      value: university,
    },
    {
      key: 'career',
      label: 'Programa académico',
      value: career,
    },
    {
      key: 'cohort',
      label: 'Cohorte',
      value: cohort,
    },
    {
      key: 'campus',
      label: 'Campus',
      value: campus,
    },
    {
      key: 'average',
      label: 'Índice',
      value: detail.ACADEMIC_AVERAGE?.toFixed?.(2) ?? 'N/A',
    },
    {
      key: 'score',
      label: 'Puntuación',
      value: detail.SCORE ?? 'N/A',
    },
  ]

  const scholarshipItems = [
    {
      key: 'status',
      label: 'Estado de beca',
      value: status.label,
    },
    {
      key: 'hours',
      label: 'Horas de servicio',
      value: `${detail.HOURS_COMPLETED}/${detail.HOURS_REQUIRED}`,
    },
    {
      key: 'progress',
      label: 'Avance de servicio',
      value: `${serviceProgress}%`,
    },
    {
      key: 'last',
      label: 'Último seguimiento',
      value: lastFollowUp,
    },
    {
      key: 'next',
      label: 'Próxima cita',
      value: nextAppointment,
    },
  ]

  const contactColumns: ColumnsType<{
    type: string
    value: string
    primary: boolean
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
    {
      dataIndex: 'primary',
      key: 'primary',
      title: 'Principal',
      width: '20%',
      align: 'center',
      render: (value) => (value ? '✓' : ''),
    },
  ]

  const contacts = [
    {
      key: 'email',
      type: 'EMAIL',
      value: detail.CONTACT_EMAIL,
      primary: true,
    },
    {
      key: 'phone',
      type: 'PHONE',
      value: formatter({
        value: detail.CONTACT_PHONE,
        format: 'phone',
      }),
      primary: false,
    },
  ]
  const availableContacts = contacts.filter(
    (contact) => contact.value && contact.value !== 'N/A'
  )

  const summaryItems = [
    ['Períodos', summary?.TERMS_COUNT ?? terms.length],
    ['Documentos', summary?.DOCUMENTS_COUNT ?? documents.length],
    [
      'Requisitos',
      `${summary?.REQUIREMENTS_COMPLETED ?? 0}/${summary?.REQUIREMENTS_COUNT ?? requirements.length}`,
    ],
    ['Solicitudes', summary?.REQUESTS_COUNT ?? requests.length],
    ['Seguimientos', summary?.FOLLOW_UPS_COUNT ?? followUps.length],
    ['Becas', summary?.SCHOLARSHIPS_COUNT ?? scholarships.length],
    ['Desembolsado', formatCurrency(summary?.TOTAL_DISBURSED ?? 0)],
    [
      'Actividades',
      `${summary?.ACTIVITIES_COMPLETED ?? 0}/${summary?.ACTIVITIES_COUNT ?? activities.length}`,
    ],
  ]

  const termsColumns: ColumnsType<StudentTerm> = [
    { dataIndex: 'PERIOD', key: 'PERIOD', title: 'Período' },
    { dataIndex: 'TERM_INDEX', key: 'TERM_INDEX', title: 'Índice' },
    { dataIndex: 'TOTAL_CREDITS', key: 'TOTAL_CREDITS', title: 'Créditos' },
    {
      dataIndex: 'COURSES',
      key: 'COURSES',
      title: 'Materias',
      render: (value: StudentTerm['COURSES']) => value?.length ?? 0,
    },
  ]

  const courseColumns: ColumnsType<StudentCourseGrade> = [
    { dataIndex: 'COURSE_NAME', key: 'COURSE_NAME', title: 'Materia' },
    { dataIndex: 'GRADE', key: 'GRADE', title: 'Calificación' },
    { dataIndex: 'CREDITS', key: 'CREDITS', title: 'Créditos' },
    { dataIndex: 'STATUS', key: 'STATUS', title: 'Estado' },
  ]

  const documentColumns: ColumnsType<StudentDocumentSummary> = [
    {
      dataIndex: 'DOCUMENT_TYPE',
      key: 'DOCUMENT_TYPE',
      title: 'Tipo',
      render: (value) => findLabel(documentTypes, value),
    },
    { dataIndex: 'FILE_NAME', key: 'FILE_NAME', title: 'Archivo' },
    {
      dataIndex: 'SIGNED_AT',
      key: 'SIGNED_AT',
      title: 'Firmado',
      render: (value) => (value ? formatDate(value) : 'No'),
    },
  ]

  const requirementColumns: ColumnsType<StudentRequirementSummary> = [
    {
      dataIndex: 'REQUIREMENT_NAME',
      key: 'REQUIREMENT_NAME',
      title: 'Requisito',
    },
    {
      dataIndex: 'IS_REQUIRED',
      key: 'IS_REQUIRED',
      title: 'Obligatorio',
      render: (value) => (value ? 'Sí' : 'No'),
    },
    { dataIndex: 'STATUS', key: 'STATUS', title: 'Estado' },
    {
      dataIndex: 'VALIDATED_AT',
      key: 'VALIDATED_AT',
      title: 'Validado',
      render: (value) => formatDate(value),
    },
  ]

  const requestColumns: ColumnsType<StudentRequestSummary> = [
    { dataIndex: 'REQUEST_ID', key: 'REQUEST_ID', title: 'Código' },
    {
      dataIndex: 'REQUEST_TYPE',
      key: 'REQUEST_TYPE',
      title: 'Tipo',
      render: (value) => findLabel(requestTypes, value),
    },
    {
      dataIndex: 'STATUS',
      key: 'STATUS',
      title: 'Estado',
      render: (value) => findLabel(requestStatuses, value),
    },
    {
      dataIndex: 'CREATED_AT',
      key: 'CREATED_AT',
      title: 'Fecha',
      render: (value) => formatDate(value),
    },
  ]

  const followUpColumns: ColumnsType<StudentFollowUpSummary> = [
    {
      dataIndex: 'FOLLOW_UP_DATE',
      key: 'FOLLOW_UP_DATE',
      title: 'Fecha',
      render: (value) => formatDate(value),
    },
    { dataIndex: 'SUMMARY', key: 'SUMMARY', title: 'Resumen' },
    {
      dataIndex: 'NEXT_APPOINTMENT',
      key: 'NEXT_APPOINTMENT',
      title: 'Próxima cita',
      render: (value) => formatDate(value),
    },
  ]

  const scholarshipColumns: ColumnsType<StudentScholarshipSummary> = [
    { dataIndex: 'NAME', key: 'NAME', title: 'Beca' },
    {
      dataIndex: 'AMOUNT',
      key: 'AMOUNT',
      title: 'Monto',
      render: (value) => formatCurrency(value),
    },
    {
      dataIndex: 'START_DATE',
      key: 'START_DATE',
      title: 'Inicio',
      render: (value) => formatDate(value),
    },
    { dataIndex: 'STATUS', key: 'STATUS', title: 'Estado' },
  ]

  const disbursementColumns: ColumnsType<StudentDisbursementSummary> = [
    { dataIndex: 'SCHOLARSHIP_NAME', key: 'SCHOLARSHIP_NAME', title: 'Beca' },
    {
      dataIndex: 'AMOUNT',
      key: 'AMOUNT',
      title: 'Monto',
      render: (value) => formatCurrency(value),
    },
    {
      dataIndex: 'DISBURSEMENT_DATE',
      key: 'DISBURSEMENT_DATE',
      title: 'Fecha',
      render: (value) => formatDate(value),
    },
    { dataIndex: 'STATUS', key: 'STATUS', title: 'Estado' },
  ]

  const activityColumns: ColumnsType<StudentActivitySummary> = [
    { dataIndex: 'TITLE', key: 'TITLE', title: 'Actividad' },
    {
      dataIndex: 'START_AT',
      key: 'START_AT',
      title: 'Fecha',
      render: (value) => formatDateTime(value),
    },
    { dataIndex: 'HOURS_EARNED', key: 'HOURS_EARNED', title: 'Horas' },
    { dataIndex: 'STATUS', key: 'STATUS', title: 'Estado' },
  ]

  const exportToPdf = () => {
    const doc = new jsPDF() as PdfWithAutoTable
    const generatedAt = dayjs().format('DD/MM/YYYY HH:mm')
    const addTable = (config: Parameters<typeof autoTable>[1]) => {
      if (!config.body?.length) return
      autoTable(doc, {
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [63, 76, 132] },
        ...config,
        startY: config.startY ?? (doc.lastAutoTable?.finalY ?? 42) + 8,
      })
    }

    doc.setFontSize(16)
    doc.text('Expediente del becario', 14, 18)
    doc.setFontSize(11)
    doc.text(fullName, 14, 27)
    doc.text(`Generado: ${generatedAt}`, 14, 34)

    addTable({
      startY: 42,
      head: [['Información personal', '']],
      body: personalItems.map((item) => [item.label, String(item.value)]),
      styles: { fontSize: 9 },
    })

    addTable({
      head: [['Información académica', '']],
      body: academicItems.map((item) => [item.label, String(item.value)]),
      styles: { fontSize: 9 },
    })

    addTable({
      head: [['Beca y seguimiento', '']],
      body: scholarshipItems.map((item) => [item.label, String(item.value)]),
      styles: { fontSize: 9 },
    })

    addTable({
      head: [['Indicador', 'Valor']],
      body: summaryItems.map(([label, value]) => [
        String(label),
        String(value),
      ]),
      styles: { fontSize: 9 },
    })

    addTable({
      head: [['Tipo', 'Valor', 'Principal']],
      body: availableContacts.map((contact) => [
        contact.type,
        contact.value || 'N/A',
        contact.primary ? 'Sí' : 'No',
      ]),
      styles: { fontSize: 9 },
    })

    addTable({
      head: [['Período', 'Índice', 'Créditos', 'Materias']],
      body: terms.map((term) => [
        term.PERIOD,
        String(term.TERM_INDEX),
        String(term.TOTAL_CREDITS),
        String(term.COURSES?.length ?? 0),
      ]),
    })

    addTable({
      head: [['Documento', 'Archivo', 'Firmado']],
      body: documents.map((document) => [
        findLabel(documentTypes, document.DOCUMENT_TYPE),
        document.FILE_NAME,
        document.SIGNED_AT ? formatDate(document.SIGNED_AT) : 'No',
      ]),
    })

    addTable({
      head: [['Solicitud', 'Tipo', 'Estado', 'Fecha']],
      body: requests.map((request) => [
        String(request.REQUEST_ID),
        findLabel(requestTypes, request.REQUEST_TYPE),
        findLabel(requestStatuses, request.STATUS),
        formatDate(request.CREATED_AT),
      ]),
    })

    addTable({
      head: [['Fecha', 'Resumen', 'Próxima cita']],
      body: followUps.map((followUp) => [
        formatDate(followUp.FOLLOW_UP_DATE),
        followUp.SUMMARY,
        formatDate(followUp.NEXT_APPOINTMENT),
      ]),
    })

    addTable({
      head: [['Beca', 'Monto', 'Inicio', 'Estado']],
      body: scholarships.map((scholarship) => [
        scholarship.NAME,
        formatCurrency(scholarship.AMOUNT),
        formatDate(scholarship.START_DATE),
        scholarship.STATUS,
      ]),
    })

    addTable({
      head: [['Beca', 'Monto', 'Fecha', 'Estado']],
      body: disbursements.map((disbursement) => [
        disbursement.SCHOLARSHIP_NAME,
        formatCurrency(disbursement.AMOUNT),
        formatDate(disbursement.DISBURSEMENT_DATE),
        disbursement.STATUS,
      ]),
    })

    addTable({
      head: [['Actividad', 'Fecha', 'Horas', 'Estado']],
      body: activities.map((activity) => [
        activity.TITLE,
        formatDateTime(activity.START_AT),
        String(activity.HOURS_EARNED),
        activity.STATUS,
      ]),
    })

    doc.save(
      `expediente_${detail.STUDENT_ID}_${fullName.replace(/\s+/g, '_')}.pdf`
    )
  }

  return (
    <CustomDrawer
      title={'Expediente del becario'}
      extra={
        <CustomButton icon={<DownloadOutlined />} onClick={exportToPdf}>
          Exportar PDF
        </CustomButton>
      }
      open={open}
      onClose={onClose}
      width={'48%'}
    >
      <CustomSpin spinning={isFetching}>
        <CustomRow justify={'start'}>
          <CustomCol xs={24}>
            <HeaderCard>
              <CustomRow align="middle" gap={20} justify={'center'}>
                <CustomCol xs={24}>
                  <CustomRow justify={'center'} width={'100%'}>
                    <CustomAvatar size={96}>{initials}</CustomAvatar>
                  </CustomRow>
                </CustomCol>
                <CustomCol style={{ textAlign: 'center' }}>
                  <CustomTitle level={3} style={{ margin: 0 }}>
                    {fullName}
                  </CustomTitle>
                  <CustomText type="secondary">{career}</CustomText>
                  <div style={{ marginTop: 10 }}>
                    <CustomTag color={status.color}>{status.label}</CustomTag>
                  </div>
                </CustomCol>
              </CustomRow>
            </HeaderCard>
          </CustomCol>
        </CustomRow>

        <SummaryGrid>
          {summaryItems.map(([label, value]) => (
            <SummaryItem key={String(label)}>
              <CustomText type="secondary">{label}</CustomText>
              <div>{value}</div>
            </SummaryItem>
          ))}
        </SummaryGrid>

        <CustomCollapse
          style={{ marginTop: 15 }}
          defaultActiveKey={[1, 2, 3]}
          items={[
            {
              key: 1,
              label: (
                <SectionTitle level={4}>Información personal</SectionTitle>
              ),
              children: (
                <CustomRow gutter={[16, 16]}>
                  {personalItems.map((item) => (
                    <CustomCol xs={24} md={12} key={item.key}>
                      <CustomText type="secondary">{item.label}</CustomText>
                      <div>{item.value || 'N/A'}</div>
                    </CustomCol>
                  ))}
                </CustomRow>
              ),
            },
            {
              key: 2,
              label: (
                <SectionTitle level={4}>Información académica</SectionTitle>
              ),
              children: (
                <CustomRow gutter={[16, 16]}>
                  {academicItems.map((item) => (
                    <CustomCol xs={24} md={12} key={item.key}>
                      <CustomText type="secondary">{item.label}</CustomText>
                      <div>{item.value || 'N/A'}</div>
                    </CustomCol>
                  ))}
                </CustomRow>
              ),
            },
            {
              key: 3,
              label: <SectionTitle level={4}>Beca y seguimiento</SectionTitle>,
              children: (
                <CustomRow gutter={[16, 16]}>
                  {scholarshipItems.map((item) => (
                    <CustomCol xs={24} md={12} key={item.key}>
                      <CustomText type="secondary">{item.label}</CustomText>
                      <div>
                        {item.key === 'status' ? (
                          <CustomTag color={status.color}>
                            {status.label}
                          </CustomTag>
                        ) : (
                          item.value || 'N/A'
                        )}
                      </div>
                    </CustomCol>
                  ))}
                </CustomRow>
              ),
            },
            ...(terms.length
              ? [
                  {
                    key: 4,
                    label: (
                      <SectionTitle level={4}>Reportes académicos</SectionTitle>
                    ),
                    children: (
                      <CustomTable
                        bordered={false}
                        columns={termsColumns}
                        dataSource={terms}
                        expandable={{
                          expandedRowRender: (term: StudentTerm) => (
                            <CustomTable
                              bordered={false}
                              columns={courseColumns}
                              dataSource={term.COURSES ?? []}
                              pagination={false}
                              rowKey="COURSE_GRADE_ID"
                            />
                          ),
                          rowExpandable: (term: StudentTerm) =>
                            Boolean(term.COURSES?.length),
                        }}
                        pagination={false}
                        rowKey="TERM_ID"
                      />
                    ),
                  },
                ]
              : []),
            ...(documents.length
              ? [
                  {
                    key: 5,
                    label: <SectionTitle level={4}>Documentos</SectionTitle>,
                    children: (
                      <CustomTable
                        bordered={false}
                        columns={documentColumns}
                        dataSource={documents}
                        pagination={false}
                        rowKey="DOCUMENT_ID"
                      />
                    ),
                  },
                ]
              : []),
            ...(requirements.length
              ? [
                  {
                    key: 6,
                    label: <SectionTitle level={4}>Requisitos</SectionTitle>,
                    children: (
                      <CustomTable
                        bordered={false}
                        columns={requirementColumns}
                        dataSource={requirements}
                        pagination={false}
                        rowKey="STUDENT_REQUIREMENT_ID"
                      />
                    ),
                  },
                ]
              : []),
            ...(requests.length
              ? [
                  {
                    key: 7,
                    label: <SectionTitle level={4}>Solicitudes</SectionTitle>,
                    children: (
                      <CustomTable
                        bordered={false}
                        columns={requestColumns}
                        dataSource={requests}
                        pagination={false}
                        rowKey="REQUEST_ID"
                      />
                    ),
                  },
                ]
              : []),
            ...(followUps.length
              ? [
                  {
                    key: 8,
                    label: <SectionTitle level={4}>Seguimientos</SectionTitle>,
                    children: (
                      <CustomTable
                        bordered={false}
                        columns={followUpColumns}
                        dataSource={followUps}
                        pagination={false}
                        rowKey="FOLLOW_UP_ID"
                      />
                    ),
                  },
                ]
              : []),
            ...(scholarships.length
              ? [
                  {
                    key: 9,
                    label: <SectionTitle level={4}>Becas</SectionTitle>,
                    children: (
                      <CustomTable
                        bordered={false}
                        columns={scholarshipColumns}
                        dataSource={scholarships}
                        pagination={false}
                        rowKey="SCHOLARSHIP_ID"
                      />
                    ),
                  },
                ]
              : []),
            ...(disbursements.length
              ? [
                  {
                    key: 10,
                    label: <SectionTitle level={4}>Desembolsos</SectionTitle>,
                    children: (
                      <CustomTable
                        bordered={false}
                        columns={disbursementColumns}
                        dataSource={disbursements}
                        pagination={false}
                        rowKey="DISBURSEMENT_ID"
                      />
                    ),
                  },
                ]
              : []),
            ...(activities.length
              ? [
                  {
                    key: 11,
                    label: <SectionTitle level={4}>Actividades</SectionTitle>,
                    children: (
                      <CustomTable
                        bordered={false}
                        columns={activityColumns}
                        dataSource={activities}
                        pagination={false}
                        rowKey="PARTICIPANT_ID"
                      />
                    ),
                  },
                ]
              : []),
            ...(availableContacts.length
              ? [
                  {
                    key: 12,
                    label: <SectionTitle level={4}>Contactos</SectionTitle>,
                    children: (
                      <CustomTable
                        bordered={false}
                        columns={contactColumns}
                        dataSource={availableContacts}
                        pagination={false}
                        rowKey="key"
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      </CustomSpin>
    </CustomDrawer>
  )
}

export default StudentDrawer
