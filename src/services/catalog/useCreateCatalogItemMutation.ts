import { generatePath } from 'react-router-dom'
import { API_PATH_GET_CATALOG_ITEMS } from 'src/constants/routes'
import { useCustomMutation } from 'src/hooks/use-custom-mutation'
import { postRequest } from '../api'
import { CatalogItem } from './catalog.types'

interface CreateCatalogItemPayload {
  key: string
  values: Partial<Omit<CatalogItem, 'CATALOG_ID' | 'ITEM_ID'>>
}

export function useCreateCatalogItemMutation() {
  return useCustomMutation<Partial<CatalogItem>, CreateCatalogItemPayload>({
    initialData: <CatalogItem>{},
    mutationKey: ['catalog', 'create-catalog-item'],
    mutationFn: async ({ key, values }) => {
      const {
        data: { data },
      } = await postRequest<CatalogItem>(
        generatePath(API_PATH_GET_CATALOG_ITEMS, { key }),
        values
      )

      return data
    },
  })
}
