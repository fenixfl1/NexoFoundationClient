export type RequestStatus = 'P' | 'R' | 'A' | 'D' | 'C'

export interface RequestItem {
  REQUEST_ID: number
  PERSON_ID?: number
  STUDENT_ID?: number | null
  NAME: string
  LAST_NAME: string
  IDENTITY_DOCUMENT: string
  UNIVERSITY: string
  CAREER: string
  REQUEST_TYPE: string
  STATUS: RequestStatus
  CREATED_AT: string
  UPDATED_AT?: string
  COHORT?: string
  ASSIGNED_COORDINATOR?: string
  CONTACT_EMAIL?: string
  CONTACT_PHONE?: string
  NEXT_APPOINTMENT?: string
  NOTES?: string
}

export interface RequestRecord {
  REQUEST_ID: number
  PERSON_ID: number
  STUDENT_ID?: number | null
  REQUEST_TYPE: string
  STATUS: RequestStatus
  ASSIGNED_COORDINATOR?: string | null
  NEXT_APPOINTMENT?: string | null
  COHORT?: string | null
  NOTES?: string | null
  CREATED_AT?: string
  UPDATED_AT?: string
}

export type CreateRequestPayload = Omit<
  RequestRecord,
  'REQUEST_ID' | 'CREATED_AT' | 'UPDATED_AT'
>

export type UpdateRequestPayload = Partial<CreateRequestPayload> & {
  REQUEST_ID: number
}
