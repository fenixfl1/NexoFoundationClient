// export type ScholarshipStatus =
//   | 'pending'
//   | 'active'
//   | 'suspended'
//   | 'completed'
//   | 'graduated'

export enum ScholarshipStatus {
  PENDING = 'P',
  ACTIVE = 'A',
  SUSPENDED = 'S',
  COMPLETED = 'C',
  GRADUATED = 'G',
}

export type StudentPayload = Partial<Student>

export interface StudentCourseGrade {
  COURSE_GRADE_ID: number
  COURSE_NAME: string
  GRADE: number
  CREDITS: number
  STATUS: string
}

export interface StudentTerm {
  TERM_ID: number
  PERIOD: string
  TERM_INDEX: number
  TOTAL_CREDITS: number
  OBSERVATIONS?: string
  CAPTURE_FILE_NAME?: string
  CREATED_AT?: string
  COURSES: StudentCourseGrade[]
}

export interface StudentDocumentSummary {
  DOCUMENT_ID: number
  DOCUMENT_TYPE: string
  FILE_NAME: string
  MIME_TYPE: string
  SIGNED_AT?: string
  DESCRIPTION?: string
  STATE?: string
  CREATED_AT?: string
}

export interface StudentRequirementSummary {
  STUDENT_REQUIREMENT_ID: number
  REQUIREMENT_ID: number
  STATUS: string
  OBSERVATION?: string
  VALIDATED_BY?: number
  VALIDATED_AT?: string
  STATE?: string
  CREATED_AT?: string
  REQUIREMENT_KEY: string
  REQUIREMENT_NAME: string
  REQUIREMENT_DESCRIPTION?: string
  IS_REQUIRED: boolean
}

export interface StudentRequestSummary {
  REQUEST_ID: number
  REQUEST_TYPE: string
  STATUS: string
  ASSIGNED_COORDINATOR?: string
  NEXT_APPOINTMENT?: string
  COHORT?: string
  NOTES?: string
  CREATED_AT?: string
}

export interface StudentFollowUpSummary {
  FOLLOW_UP_ID: number
  APPOINTMENT_ID?: number
  FOLLOW_UP_DATE: string
  SUMMARY: string
  NOTES?: string
  NEXT_APPOINTMENT?: string
  STATUS: string
  STATE?: string
  CREATED_AT?: string
}

export interface StudentScholarshipSummary {
  SCHOLARSHIP_ID: number
  REQUEST_ID?: number
  NAME: string
  DESCRIPTION?: string
  AMOUNT: number
  START_DATE: string
  END_DATE?: string
  PERIOD_TYPE: string
  STATUS: string
  STATE?: string
  CREATED_AT?: string
}

export interface StudentDisbursementSummary {
  DISBURSEMENT_ID: number
  SCHOLARSHIP_ID: number
  SCHOLARSHIP_NAME: string
  AMOUNT: number
  DISBURSEMENT_DATE: string
  METHOD?: string
  REFERENCE?: string
  STATUS: string
  NOTES?: string
  STATE?: string
  CREATED_AT?: string
}

export interface StudentActivitySummary {
  PARTICIPANT_ID: number
  ACTIVITY_ID: number
  TITLE: string
  START_AT: string
  END_AT?: string
  LOCATION?: string
  HOURS: number
  HOURS_EARNED: number
  STATUS: string
  ATTENDED_AT?: string
  CREATED_AT?: string
}

export interface StudentExpedientSummary {
  TERMS_COUNT: number
  DOCUMENTS_COUNT: number
  REQUIREMENTS_COUNT: number
  REQUIREMENTS_COMPLETED: number
  REQUESTS_COUNT: number
  FOLLOW_UPS_COUNT: number
  SCHOLARSHIPS_COUNT: number
  DISBURSEMENTS_COUNT: number
  TOTAL_DISBURSED: number
  ACTIVITIES_COUNT: number
  ACTIVITIES_COMPLETED: number
}

export interface Student {
  STUDENT_ID: number
  CREATED_AT?: string
  PERSON_ID: number
  NAME: string
  LAST_NAME: string
  BIRTH_DATE?: string
  DOCUMENT_TYPE?: string
  GENDER?: string
  IDENTITY_DOCUMENT: string
  UNIVERSITY: string
  CAREER: string
  SCHOLARSHIP_STATUS: ScholarshipStatus
  ACADEMIC_AVERAGE: number
  HOURS_REQUIRED: number
  HOURS_COMPLETED: number
  LAST_FOLLOW_UP: string
  NEXT_APPOINTMENT?: string
  CONTACT_EMAIL: string
  CONTACT_PHONE: string
  COHORT: string
  CAMPUS?: string
  SCORE?: number
  STATE?: string
  FILTER?: string
  TERMS?: StudentTerm[]
  DOCUMENTS?: StudentDocumentSummary[]
  REQUIREMENTS?: StudentRequirementSummary[]
  REQUESTS?: StudentRequestSummary[]
  FOLLOW_UPS?: StudentFollowUpSummary[]
  SCHOLARSHIPS?: StudentScholarshipSummary[]
  DISBURSEMENTS?: StudentDisbursementSummary[]
  ACTIVITIES?: StudentActivitySummary[]
  EXPEDIENT_SUMMARY?: StudentExpedientSummary
}
