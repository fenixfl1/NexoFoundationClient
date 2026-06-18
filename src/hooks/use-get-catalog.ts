import { useEffect, useState } from 'react'
import { CatalogItem } from 'src/services/catalog/catalog.types'
import { useCatalogStore } from 'src/store/catalog.store'

export function useGetCatalog(
  catalogName: string
): [Pick<CatalogItem, 'ITEM_ID' | 'EXTRA' | 'LABEL' | 'VALUE'>[]] {
  const [list, setList] = useState<
    Pick<CatalogItem, 'ITEM_ID' | 'EXTRA' | 'LABEL' | 'VALUE'>[]
  >([])

  const { multiCatalogList = {} } = useCatalogStore()

  useEffect(() => {
    if (catalogName && Object.keys(multiCatalogList).length) {
      const catalogItems = multiCatalogList[catalogName]
      setList(Array.isArray(catalogItems) ? catalogItems : [])
    }
  }, [multiCatalogList, catalogName])

  return [Array.isArray(list) ? list : []]
}
