import { useQuery } from '@tanstack/react-query'
import { API_PATH_GET_STUDENT } from 'src/constants/routes'
import { getRequest } from '../api'
import { Student } from './student.types'

export function useGetStudentQuery(studentId?: number, enabled = true) {
  return useQuery({
    enabled: Boolean(studentId && enabled),
    queryKey: ['students', 'get-one', studentId],
    queryFn: async () => {
      const { data } = await getRequest<Student>(
        API_PATH_GET_STUDENT,
        studentId
      )

      return data?.data as Student
    },
  })
}
