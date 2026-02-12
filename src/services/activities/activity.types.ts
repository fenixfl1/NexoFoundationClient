export type ActivityStatus = 'planned' | 'completed' | 'cancelled'
export type ParticipantStatus = 'registered' | 'completed' | 'cancelled'

export interface Activity {
  ACTIVITY_ID: number
  TITLE: string
  DESCRIPTION?: string | null
  START_AT: string
  END_AT?: string | null
  LOCATION?: string | null
  HOURS: number
  CAPACITY?: number | null
  STATUS: ActivityStatus
  ENROLLED?: number
}

export interface ActivityPayload
  extends Omit<Activity, 'ACTIVITY_ID' | 'ENROLLED'> {}

export interface ActivityParticipant {
  PARTICIPANT_ID: number
  ACTIVITY_ID: number
  STUDENT_ID: number
  STATUS: ParticipantStatus
  HOURS_EARNED: number
  ATTENDED_AT?: string | null
}
