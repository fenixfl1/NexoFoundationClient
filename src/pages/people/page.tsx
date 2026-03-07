import { Form } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomRangePicker from 'src/components/custom/CustomRangePicker'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import { ColumnMapValue } from 'src/components/custom/CustomTable'
import CustomTag from 'src/components/custom/CustomTag'
import RoleSelector from 'src/components/RoleSelector'
import SmartTable from 'src/components/SmartTable'
import { defaultBreakpoints } from 'src/config/breakpoints'
import useDebounce from 'src/hooks/use-debounce'
import { Person } from 'src/services/people/people.types'
import { useGetPaginatedPeopleMutation } from 'src/services/people/useGetPaginatedPeopleMutation'
import { usePeopleStore } from 'src/store/people.store'
import { AdvancedCondition } from 'src/types/general'
import formatter from 'src/utils/formatter'
import { getConditionFromForm } from 'src/utils/get-condition-from'

const initialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const states = {
  A: 'Activo',
  I: 'Inactivo',
}

const Page: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const debounce = useDebounce(searchKey)
  const { peopleList, metadata } = usePeopleStore()

  const { mutate: getPaginatedPeople, isPending: isGetPeoplePending } =
    useGetPaginatedPeopleMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = initialFilter.FILTER } = form.getFieldsValue()

      const filter = getConditionFromForm(FILTER)

      const condition: AdvancedCondition[] = [...filter]

      if (debounce) {
        condition.push({
          value: debounce,
          field: 'FILTER',
          operator: 'LIKE',
        })
      }

      getPaginatedPeople({ page, size, condition })
    },
    [debounce]
  )

  useEffect(handleSearch, [handleSearch])

  const handleEdit = (record: Person) => {
    navigate(location.pathname + '/edit/' + record.PERSON_ID)
  }

  const columns: ColumnsType<unknown> = [
    {
      dataIndex: 'PERSON_ID',
      key: 'PERSON_ID',
      title: 'Código',
      align: 'center',
    },
    {
      dataIndex: 'NAME',
      key: 'NAME',
      title: 'Nombres',
    },
    {
      dataIndex: 'LAST_NAME',
      key: 'LAST_NAME',
      title: 'Apellidos',
    },
    {
      dataIndex: 'IDENTITY_DOCUMENT',
      key: 'IDENTITY_DOCUMENT',
      title: 'Cédula',
      render: (value) => formatter({ value, format: 'document' }),
    },
    {
      dataIndex: 'PHONE',
      key: 'PHONE',
      title: 'Teléfono',
      render: (value) => formatter({ value, format: 'phone' }),
    },
    {
      dataIndex: 'EMAIL',
      key: 'EMAIL',
      title: 'Correo',
    },
    {
      dataIndex: 'ROLE_NAME',
      key: 'ROLE_NAME',
      title: 'Rol',
      render: (value) => (value ? <CustomTag>{value}</CustomTag> : ''),
    },
  ]

  const columnsMap: Partial<Record<keyof Person, ColumnMapValue<Person>>> = {
    PERSON_ID: 'Código',
    NAME: 'Nombre',
    LAST_NAME: 'Apellido',
    IDENTITY_DOCUMENT: {
      header: 'Doc. Identidad',
      render: (value: string) => formatter({ value, format: 'document' }),
    },
    PHONE: {
      header: 'Teléfono',
      render: (value: string) => formatter({ value, format: 'phone' }),
    },
    EMAIL: 'Correo',
    ROLE_NAME: 'Rol',
    STATE: {
      header: 'Estado',
      render: (value: string) => states[value],
    },
  }

  const filter = (
    <CustomRow justify={'space-between'}>
      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem label={'Estado'} name={['FILTER', 'STATE__IN']}>
          <CustomSelect
            placeholder={'Estado'}
            mode={'multiple'}
            options={[
              { value: 'A', label: 'Activos' },
              { value: 'I', label: 'Inactivos' },
            ]}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem label={'Rol'} name={['FILTER', 'ROLE_ID__IN']}>
          <RoleSelector multiple />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Fecha de Registro'}
          name={['FILTER', 'CREATED_AT__BETWEEN']}
          labelCol={{ span: 24 }}
        >
          <CustomRangePicker width={'100%'} />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  return (
    <SmartTable
      columnsMap={columnsMap}
      exportable
      columns={columns}
      dataSource={peopleList}
      filter={filter}
      form={form}
      initialFilter={initialFilter}
      loading={isGetPeoplePending}
      metadata={metadata}
      onChange={handleSearch}
      onSearch={setSearchKey}
      createText={'Nueva Persona'}
      searchPlaceholder={'Buscar personas...'}
      onCreate={() => navigate(location.pathname + '/create')}
      onEdit={handleEdit}
    />
  )
}

export default Page
