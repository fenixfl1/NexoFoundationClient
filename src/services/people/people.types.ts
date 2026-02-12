import { Contact } from '../contact/contact.types'
import { Student } from '../students/student.types'

export interface Person {
  PERSON_ID: number
  NAME: string
  LAST_NAME: string
  GENDER: string
  BIRTH_DATE: string
  DOCUMENT_TYPE?: string | null
  IDENTITY_DOCUMENT: string
  STATE: string
  STUDENT_ID?: number
  CREATED_AT: string
  CREATED_BY: number
  PHONE?: string
  EMAIL?: string
  ROLE_NAME?: string
  USERNAME: string
  ADDRESS: string
  AVATAR: string
  CONTACTS: Contact[]
  REFERENCES: Reference[]
  USER_ID: number
}

export interface Reference {
  RELATIONSHIP: string
  PHONE: string
  EMAIL: string
  ADDRESS: string
  NOTES: string
  FULL_NAME: string
  STATE: string
  CREATED_AT: string
  CREATED_BY: number
}

export interface PersonPayload {
  PASSWORD: string
  USERNAME: string
  NAME: string
  LAST_NAME: string
  GENDER: string
  BIRTH_DATE: string
  IDENTITY_DOCUMENT: string
  ROLE_ID: number
  CONTACTS: Contact[]
  REFERENCES: Reference[]
  STUDENT?: Student
  INCOMPLETE?: boolean
  PERSON_TYPE?: string
  DOCUMENT_TYPE?: string
  DOCUMENTS?: {
    DOCUMENT_TYPE: string
    FILE_NAME: string
    MIME_TYPE: string
    FILE_BASE64: string
    SIGNED_BASE64?: string | null
    SIGNED_AT?: string | null
    DESCRIPTION?: string | null
    STATE?: string
  }[]
}
