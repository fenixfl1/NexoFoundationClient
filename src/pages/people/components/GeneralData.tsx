import { Form, FormInstance } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import CatalogSelector from 'src/components/CatalogSelector'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDatePicker from 'src/components/custom/CustomDatePicker'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInput from 'src/components/custom/CustomInput'
import CustomInputNumber from 'src/components/custom/CustomInputNumber'
import CustomMaskedInput from 'src/components/custom/CustomMaskedInput'
import { CustomParagraph } from 'src/components/custom/CustomParagraph'
import CustomRadioGroup from 'src/components/custom/CustomRadioGroup'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSelect from 'src/components/custom/CustomSelect'
import CustomSpaceCompact from 'src/components/custom/CustomSpaceCompact'
import { defaultBreakpoints, labelColFullWidth } from 'src/config/breakpoints'
import useDebounce from 'src/hooks/use-debounce'
import { useGetCatalog } from 'src/hooks/use-get-catalog'
import { CatalogItem } from 'src/services/catalog/catalog.types'
import { PersonPayload } from 'src/services/people/people.types'
import { useGetRolePaginationMutation } from 'src/services/roles/useGetRolePaginationMutation'
import { useRoleStore } from 'src/store/role.store'
import { normalizeNumbers } from 'src/utils/form-value-normalize'

interface GeneralDataProps {
  form: FormInstance<PersonPayload>
}

const GeneralData: React.FC<GeneralDataProps> = ({ form }) => {
  const roleId = Form.useWatch('ROLE_ID', form)
  const documentType = Form.useWatch('DOCUMENT_TYPE', form)
  const personType = Form.useWatch('PERSON_TYPE', form)

  const { action } = useParams()

  const [searchKey, setSearchKey] = useState('')
  const debounce = useDebounce(searchKey)

  const { roleList, metadata } = useRoleStore()

  const { mutate: getRoles, isPending: isGetRolesPending } =
    useGetRolePaginationMutation()

  const [documentTypes] = useGetCatalog('ID_LIST_DOCUMENT_TYPE')
  const [personTypes] = useGetCatalog('ID_LISTA_TIPO_PERSONAS')

  const isEditing = action === 'edit'

  const selectedDocument = useMemo(() => {
    if (!documentType)
      return {
        EXTRAS: { type: '1', placeholder: '000-0000000-0' },
      } as unknown as Pick<CatalogItem, 'VALUE' | 'ITEM_ID' | 'EXTRA' | 'LABEL'>
    const item = documentTypes.find((doc) => doc.VALUE === documentType)

    return item
  }, [documentType, documentTypes])

  const handleSearchRoles = useCallback(() => {
    getRoles({
      page: metadata.currentPage,
      size: metadata.pageSize,
      condition: [
        {
          value: 'A',
          field: 'STATE',
          operator: '=',
        },
        {
          value: debounce,
          field: 'NAME',
          operator: 'LIKE',
        },
      ],
    })
  }, [debounce])

  useEffect(handleSearchRoles, [handleSearchRoles])

  return (
    <CustomRow justify={'start'}>
      <CustomFormItem
        hidden
        label={'Estado'}
        name={'STATE'}
        rules={[{ required: true }]}
        initialValue={'A'}
      >
        <CustomSelect
          placeholder={'Seleccionar Estado'}
          options={[
            { label: 'Activo', value: 'A' },
            { label: 'Inactivo', value: 'I' },
          ]}
        />
      </CustomFormItem>
      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Código'}
          name={'PERSON_ID'}
          rules={[{ required: isEditing }]}
        >
          <CustomInputNumber width={null} readOnly placeholder={'0'} />
        </CustomFormItem>
      </CustomCol>

      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Rol.'}
          name={'ROLE_ID'}
          rules={[{ required: true }]}
        >
          <CustomSelect
            readonly={isEditing}
            onSearch={setSearchKey}
            loading={isGetRolesPending}
            onSelect={(value) => {
              form.setFieldValue('PERSON_TYPE', value === 2 ? null : 'P')
            }}
            placeholder={'Seleccionar Rol'}
            options={roleList.map((rol) => ({
              label: rol.NAME,
              value: rol.ROLE_ID,
            }))}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          required
          label={'Doc. Identidad'}
          rules={[{ required: true }]}
        >
          <CustomSpaceCompact style={{ width: '100%' }}>
            <CustomFormItem
              label={'Tipo de Documento'}
              noStyle
              rules={[{ required: true }]}
              name={'DOCUMENT_TYPE'}
              initialValue={'1'}
            >
              <CatalogSelector
                width={'25%'}
                catalog={'ID_LIST_DOCUMENT_TYPE'}
              />
            </CustomFormItem>
            <CustomFormItem
              label={'Documento de Identidad'}
              name={'IDENTITY_DOCUMENT'}
              noStyle
              rules={[{ required: true }]}
              getValueFromEvent={normalizeNumbers}
              valuePropName={'value'}
            >
              <CustomMaskedInput
                disabled={!documentType}
                readonly={isEditing}
                placeholder={selectedDocument?.EXTRA?.placeholder}
                type={
                  !documentType
                    ? 'document'
                    : (selectedDocument?.EXTRA?.type as never) || 'document'
                }
              />
            </CustomFormItem>
          </CustomSpaceCompact>
        </CustomFormItem>
      </CustomCol>
      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Tipo Persona'}
          name={'PERSON_TYPE'}
          rules={[{ required: true }]}
        >
          <CustomSelect
            disabled={roleId !== 2}
            placeholder={'Seleccionar tipo de persona'}
            options={personTypes.map((item) => ({
              label: item.LABEL,
              value: item.VALUE,
            }))}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Nombres'}
          name={'NAME'}
          rules={[{ required: true }]}
        >
          <CustomInput placeholder={'Nombres'} />
        </CustomFormItem>
      </CustomCol>
      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Apellidos'}
          name={'LAST_NAME'}
          rules={[{ required: personType === 'P' }]}
        >
          <CustomInput
            disabled={personType !== 'P'}
            placeholder={'Apellidos'}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Sexo.'}
          name={'GENDER'}
          rules={[{ required: personType === 'P' }]}
        >
          <CustomRadioGroup
            disabled={personType !== 'P'}
            options={[
              { label: 'Masculino', value: 'M' },
              { label: 'Femenino', value: 'F' },
            ]}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={personType === 'P' ? 'Fecha Nac.' : 'Fecha Fundación'}
          name={'BIRTH_DATE'}
          rules={[{ required: true }]}
        >
          <CustomDatePicker />
        </CustomFormItem>
      </CustomCol>
      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Usuario'}
          name={'USERNAME'}
          rules={[{ required: roleId !== 2 }]}
        >
          <CustomInput
            prefix={'@'}
            readOnly={isEditing}
            disabled={roleId === 2}
            placeholder={'Nombre de Usuario'}
          />
        </CustomFormItem>
      </CustomCol>
      <CustomCol xs={24}>
        <CustomFormItem
          shouldUpdate
          label={' '}
          colon={false}
          {...labelColFullWidth}
        >
          {() => (
            <CustomParagraph>
              <pre>{JSON.stringify(form.getFieldsValue(), null, 2)}</pre>
            </CustomParagraph>
          )}
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )
}

export default GeneralData
