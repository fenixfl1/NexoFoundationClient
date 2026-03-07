import { API_PATH_EXPORT_REPORT } from 'src/constants/routes'
import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { postRequest } from '../api'
import { ReportExportPayload, ReportExportResult } from './report.types'

export function useExportReportMutation() {
  return useCustomMutation<ReportExportResult, ReportExportPayload>({
    mutationKey: ['reports', 'export'],
    mutationFn: async ({ key, filters, format }) => {
      const {
        data: { data },
      } = await postRequest<ReportExportResult>(`${API_PATH_EXPORT_REPORT}/${key}`, {
        filters,
        format,
      })

      return data
    },
  })
}

