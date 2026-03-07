import { useQuery } from '@tanstack/react-query'
import { API_PATH_GET_REPORT_CATALOG } from 'src/constants/routes'
import { useReportStore } from 'src/store/reports.store'
import { getRequest } from '../api'
import { ReportCatalogItem } from './report.types'

export function useGetReportCatalogQuery() {
  const { catalog, setCatalog } = useReportStore()

  return useQuery({
    queryKey: ['reports', 'catalog'],
    initialData: catalog,
    queryFn: async () => {
      const {
        data: { data },
      } = await getRequest<ReportCatalogItem[]>(API_PATH_GET_REPORT_CATALOG)

      setCatalog(data ?? [])
      return data ?? []
    },
  })
}

