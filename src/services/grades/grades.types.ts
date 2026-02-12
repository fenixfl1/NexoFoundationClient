export type CourseStatus = 'passed' | 'failed' | 'in_progress'

export interface CourseGrade {
  COURSE_GRADE_ID?: number
  TERM_ID?: number
  COURSE_NAME: string
  GRADE: number
  CREDITS: number
  STATUS?: CourseStatus
}

export interface Term {
  TERM_ID: number
  STUDENT_ID: number
  PERIOD: string
  TERM_INDEX: number
  TOTAL_CREDITS: number
  CAPTURE_FILE_NAME?: string | null
  CAPTURE_MIME_TYPE?: string | null
  CAPTURE_BASE64?: string | null
  OBSERVATIONS?: string | null
  COURSES?: CourseGrade[]
  NAME?: string
  LAST_NAME?: string
  IDENTITY_DOCUMENT?: string
  UNIVERSITY?: string
  CAREER?: string
}

export type TermPayload = Omit<
  Term,
  | 'TERM_ID'
  | 'TERM_INDEX'
  | 'TOTAL_CREDITS'
  | 'COURSES'
  | 'NAME'
  | 'LAST_NAME'
  | 'IDENTITY_DOCUMENT'
  | 'UNIVERSITY'
  | 'CAREER'
> & {
  COURSES: CourseGrade[]
}
