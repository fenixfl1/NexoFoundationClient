import { API_PATH_RUN_REPORT } from 'src/constants/routes'
import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { useReportStore } from 'src/store/reports.store'
import { getQueryString, postRequest } from '../api'
import { ReportRunPayload, ReportRunResponse } from './report.types'

const initialData: ReportRunResponse = {
  data: [],
  metadata: {
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalRows: 0,
      count: 0,
      pageSize: 10,
      links: undefined,
    },
    summary: {},
  },
}

export function useRunReportMutation() {
  const { setReportResult } = useReportStore()

  return useCustomMutation<ReportRunResponse, ReportRunPayload>({
    mutationKey: ['reports', 'run'],
    initialData,
    onSuccess: setReportResult,
    onError: () => setReportResult(initialData),
    mutationFn: async ({ key, filters, page, size }) => {
      const {
        data: { data, metadata },
      } = await postRequest<Record<string, unknown>[]>(
        getQueryString(`${API_PATH_RUN_REPORT}/${key}`, { page, size }),
        { filters }
      )

      return {
        data: data ?? [],
        metadata:
          metadata ??
          ({
            pagination: initialData.metadata.pagination,
            summary: {},
          } as ReportRunResponse['metadata']),
      }
    },
  })
}

