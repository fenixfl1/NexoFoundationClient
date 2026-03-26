import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CustomSelect, { CustomSelectProps } from './CustomSelect'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import { useGetPaginatedPeopleMutation } from 'src/services/people/useGetPaginatedPeopleMutation'
import { Person } from 'src/services/people/people.types'

interface CustomPersonSelectorProps extends Omit<
  CustomSelectProps,
  'filterOption' | 'options' | 'loading'
> {
  roleId?: number | number[]
}

const CustomPersonSelector: React.FC<CustomPersonSelectorProps> = ({
  roleId,
  placeholder = 'Seleccionar...',
  allowClear = true,
  showSearch = true,
}) => {
  const [searchKey, setSearchKey] = useState('')
  const debounce = useDebounce(searchKey)

  const {
    mutate,
    isPending,
    data: { data },
  } = useGetPaginatedPeopleMutation()

  const options = useMemo(() => {
    if (!data?.length) return []

    return data?.map((item) => ({
      label: `${item.NAME} ${item.LAST_NAME}`,
      value: item.USER_ID,
    }))
  }, [data])

  const handleOnSearch = useCallback(() => {
    const condition: AdvancedCondition<Person>[] = [
      {
        value: 'A',
        operator: '=',
        field: 'STATE',
      },
    ]

    if (roleId) {
      condition.push({
        value: roleId,
        operator: typeof roleId === 'number' ? '=' : 'IN',
        field: 'ROLE_ID',
      })
    }

    if (debounce) {
      condition.push({
        value: debounce,
        field: ['NAME', 'LAST_NAME', 'IDENTITY_DOCUMENT'],
        operator: 'LIKE',
      })
    }

    mutate({ page: 1, size: 15, condition })
  }, [debounce, roleId])

  useEffect(handleOnSearch, [handleOnSearch])

  return (
    <CustomSelect
      loading={isPending}
      placeholder={placeholder}
      options={options}
      onSearch={setSearchKey}
      allowClear={allowClear}
      showSearch={showSearch}
    />
  )
}

export default CustomPersonSelector
