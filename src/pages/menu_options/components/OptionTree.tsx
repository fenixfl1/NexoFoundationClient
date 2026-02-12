import React from 'react'
import CustomCard from 'src/components/custom/CustomCard'
import CustomCol from 'src/components/custom/CustomCol'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomRow from 'src/components/custom/CustomRow'
import CustomSearch from 'src/components/custom/CustomSearch'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTree from 'src/components/custom/CustomTree'
import styled from 'styled-components'

const TreeContainer = styled.div`
  height: 450px;
  max-height: 500px;
  overflow: auto;
`

interface OptionTreeProps {
  onSelect?: (keys?: string) => void
  onSearch?: (value: string) => void
  loading?: boolean
  treeData?: never[]
  selectedKey: string
}

const OptionTree: React.FC<OptionTreeProps> = ({
  onSelect,
  onSearch,
  loading,
  treeData,
  selectedKey,
}) => {
  return (
    <CustomCol xs={24}>
      <CustomCard>
        <CustomSpin spinning={loading}>
          <CustomRow justify={'end'}>
            <CustomSearch
              allowClear
              placeholder={'Buscar...'}
              onChange={(e) => onSearch(e.target.value)}
            />
            <CustomDivider />
            <CustomCol xs={24}>
              <TreeContainer>
                <CustomTree
                  switcherIcon={() => (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      className="lucide lucide-folder-icon lucide-folder"
                    >
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                    </svg>
                  )}
                  checkable={false}
                  showIcon
                  showLine
                  treeData={treeData}
                  onSelect={(keys) => onSelect?.(keys?.[0] as string)}
                  selectedKeys={selectedKey ? [selectedKey] : []}
                  defaultExpandAll
                />
              </TreeContainer>
            </CustomCol>
          </CustomRow>
        </CustomSpin>
      </CustomCard>
    </CustomCol>
  )
}

export default OptionTree
