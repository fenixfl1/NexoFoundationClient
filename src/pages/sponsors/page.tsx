import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import SmartTable from 'src/components/SmartTable'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomTag from 'src/components/custom/CustomTag'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomDivider from 'src/components/custom/CustomDivider'
import StateSelector from 'src/components/StateSelector'
import { ColumnsType } from 'antd/lib/table'
import { useSponsorStore } from 'src/store/sponsor.store'
import { Sponsor } from 'src/services/sponsors/sponsor.types'
import { useGetSponsorPaginationMutation } from 'src/services/sponsors/useGetSponsorPaginationMutation'
import { useUpdateSponsorMutation } from 'src/services/sponsors/useUpdateSponsorMutation'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import useDebounce from 'src/hooks/use-debounce'
import { AdvancedCondition } from 'src/types/general'
import { getConditionFromForm } from 'src/utils/get-condition-from'
import { CustomText } from 'src/components/custom/CustomParagraph'
import formatter from 'src/utils/formatter'

const sponsorInitialFilter = {
  FILTER: {
    STATE__IN: ['A'],
  },
}

const sponsorTypeOptions = [
  { label: 'Empresa', value: 'E' },
  { label: 'Persona', value: 'P' },
  { label: 'Fundación', value: 'F' },
  { label: 'ONG', value: 'N' },
  { label: 'Otro', value: 'O' },
]

const SponsorsPage: React.FC = () => {
  const [form] = Form.useForm()
  const [searchKey, setSearchKey] = useState('')
  const debounce = useDebounce(searchKey)
  const { confirmModal } = useCustomModal()
  const [errorHandler] = useErrorHandler()

  const { sponsors, metadata } = useSponsorStore()
  const { mutate: getSponsors, isPending } = useGetSponsorPaginationMutation()
  const { mutateAsync: updateSponsor, isPending: isUpdatePending } =
    useUpdateSponsorMutation()

  const handleSearch = useCallback(
    (page = metadata.currentPage, size = metadata.pageSize) => {
      const { FILTER = sponsorInitialFilter.FILTER } = form.getFieldsValue()
      const condition: AdvancedCondition[] = getConditionFromForm(FILTER)

      if (debounce) {
        condition.push({
          value: debounce,
          operator: 'LIKE',
          field: [
            'PERSON_NAME',
            'PERSON_LAST_NAME',
            'PERSON_IDENTITY_DOCUMENT',
            'NAME',
            'TYPE',
            'TAX_ID',
          ],
        })
      }

      getSponsors({ page, size, condition })
    },
    [debounce, form, metadata.currentPage, metadata.pageSize, getSponsors]
  )

  useEffect(handleSearch, [handleSearch])

  const handleToggleState = (record: Sponsor) => {
    confirmModal({
      title: 'Confirmación',
      content: `¿Deseas ${
        record.STATE === 'A' ? 'desactivar' : 'activar'
      } el patrocinador "${record.NAME}"?`,
      onOk: async () => {
        try {
          await updateSponsor({
            SPONSOR_ID: record.SPONSOR_ID,
            STATE: record.STATE === 'A' ? 'I' : 'A',
          } as Sponsor)
          handleSearch()
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const columns: ColumnsType<Sponsor> = useMemo(
    () => [
      {
        dataIndex: 'NAME',
        key: 'NAME',
        title: 'Patrocinador',
        render: (_, record) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>
              {record.PERSON_NAME || record.NAME}{' '}
              {record.PERSON_LAST_NAME ?? ''}
            </CustomText>
            <CustomText type="secondary">
              {formatter({
                value: record.PERSON_IDENTITY_DOCUMENT,
                format: 'document',
              }) ??
                record.TAX_ID ??
                '—'}
            </CustomText>
          </CustomSpace>
        ),
      },
      {
        width: '7%',
        dataIndex: 'TYPE',
        key: 'TYPE',
        title: 'Tipo',
        render: (value: string) => {
          const option = sponsorTypeOptions.find((item) => item.value === value)
          return <CustomTag color="blue">{option?.label ?? value}</CustomTag>
        },
      },
    ],
    []
  )

  const filter = (
    <CustomRow gutter={[8, 8]}>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Estado'}
          name={['FILTER', 'STATE__IN']}
          labelCol={{ span: 24 }}
        >
          <StateSelector />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          label={'Tipo'}
          name={['FILTER', 'TYPE__IN']}
          labelCol={{ span: 24 }}
        >
          <CustomSelect
            mode="multiple"
            placeholder="Seleccionar tipos"
            allowClear
            options={sponsorTypeOptions}
          />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )

  return (
    <>
      <CustomDivider />
      <SmartTable
      exportable
        form={form}
        rowKey="SPONSOR_ID"
        loading={isPending || isUpdatePending}
        columns={columns}
        dataSource={sponsors}
        metadata={metadata}
        searchPlaceholder={'Buscar patrocinadores...'}
        onChange={handleSearch}
        onSearch={setSearchKey}
        onUpdate={handleToggleState}
        filter={filter}
        initialFilter={sponsorInitialFilter}
      />
    </>
  )
}

export default SponsorsPage
