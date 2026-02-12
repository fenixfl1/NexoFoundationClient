export interface StudentDocument {
  DOCUMENT_ID: number
  STUDENT_ID: number
  DOCUMENT_TYPE: string
  FILE_NAME: string
  MIME_TYPE: string
  FILE_BASE64: string
  SIGNED_BASE64?: string | null
  SIGNED_AT?: string | null
  DESCRIPTION?: string | null
  STATE?: string
  CREATED_AT?: string
  PERSON_ID?: number
  NAME?: string
  LAST_NAME?: string
  IDENTITY_DOCUMENT?: string
  UNIVERSITY?: string
  CAREER?: string
  GROUP_KEY?: string
}

export type StudentDocumentPayload = Omit<
  StudentDocument,
  | 'DOCUMENT_ID'
  | 'PERSON_ID'
  | 'NAME'
  | 'LAST_NAME'
  | 'IDENTITY_DOCUMENT'
  | 'UNIVERSITY'
  | 'CAREER'
  | 'CREATED_AT'
>
