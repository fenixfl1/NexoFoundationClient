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

  // eslint-disable-next-line no-console
  console.log({ multiCatalogList })

  useEffect(() => {
    if (catalogName && Object.keys(multiCatalogList).length) {
      setList(multiCatalogList[catalogName])
    }
  }, [multiCatalogList, catalogName])

  return [list ?? []]
}
