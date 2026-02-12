import { Empty } from 'antd'
import React from 'react'
import { Link } from 'react-router-dom'
import ConditionalComponent from 'src/components/ConditionalComponent'
import CustomCard from 'src/components/custom/CustomCard'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDescriptions from 'src/components/custom/CustomDescription'
import CustomDivider from 'src/components/custom/CustomDivider'
import {
  CustomText,
  CustomParagraph,
} from 'src/components/custom/CustomParagraph'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomSwitch from 'src/components/custom/CustomSwitch'
import CustomTag from 'src/components/custom/CustomTag'
import SVGReader from 'src/components/SVGReader'
import { MenuOption } from 'src/services/menu-options/menu-options.types'
import formatter from 'src/utils/formatter'

interface OptionDetailProps {
  selectedOption?: MenuOption
  onChange?: () => void
}

const OptionDetail: React.FC<OptionDetailProps> = ({
  selectedOption = {} as MenuOption,
  onChange,
}) => {
  const permissions = selectedOption?.PERMISSIONS || []

  return (
    <CustomCol xs={24}>
      <CustomCard height={'100%'}>
        <CustomDivider>
          <CustomText strong>Detalle</CustomText>
        </CustomDivider>
        <ConditionalComponent
          condition={!!selectedOption?.MENU_OPTION_ID}
          fallback={
            <CustomRow align={'middle'} justify={'center'}>
              <Empty
                description={
                  <CustomText type="secondary">
                    Selecciona una opción para ver el detalle.
                  </CustomText>
                }
              />
            </CustomRow>
          }
        >
          <CustomSpace>
            <CustomDescriptions
              column={2}
              bordered
              items={[
                {
                  key: 'icon',
                  label: 'Icono',
                  children: <SVGReader svg={selectedOption?.ICON} />,
                },
                {
                  key: 'order',
                  label: 'Orden',
                  children: selectedOption?.ORDER,
                },
                {
                  key: 'parent_id',
                  label: 'Padre',
                  children: selectedOption?.PARENT_ID,
                },
                {
                  key: 'created_at',
                  label: 'Creación',
                  children: formatter({
                    value: selectedOption?.['CREATED_AT'],
                    format: 'datetime',
                  }),
                },
                {
                  key: 'name',
                  label: 'Nombre',
                  children: selectedOption?.NAME,
                  span: 2,
                },
                {
                  span: 2,
                  key: 'description',
                  label: 'Descripción',
                  children: (
                    <CustomParagraph style={{ marginBottom: 0 }}>
                      {selectedOption?.DESCRIPTION || '—'}
                    </CustomParagraph>
                  ),
                },
                {
                  key: 'path',
                  label: 'Ruta',
                  children: (
                    <Link to={'/admin' + selectedOption?.PATH} target="_blank">
                      {selectedOption?.PATH}
                    </Link>
                  ),
                },
                {
                  key: 'type',
                  label: 'Tipo',
                  children: selectedOption?.TYPE,
                },
                {
                  key: 'state',
                  label: 'Estado',
                  children: (
                    <CustomSwitch
                      checked={selectedOption?.STATE === 'A'}
                      checkedChildren="Activa"
                      unCheckedChildren="Inactiva"
                      onChange={onChange}
                    />
                  ),
                },
                {
                  key: 'permissions',
                  label: 'Permisos',
                  children: (
                    <ConditionalComponent
                      condition={permissions.length > 0}
                      fallback={
                        <CustomText type="secondary">
                          Sin permisos asociados.
                        </CustomText>
                      }
                    >
                      <div>
                        {permissions.map((perm) => (
                          <CustomTag key={perm.PERMISSION_ID} color="geekblue">
                            {perm.ACTION_NAME}
                          </CustomTag>
                        ))}
                      </div>
                    </ConditionalComponent>
                  ),
                },
              ]}
            />
          </CustomSpace>
        </ConditionalComponent>
      </CustomCard>
    </CustomCol>
  )
}

export default OptionDetail
