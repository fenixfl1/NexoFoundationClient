import React from 'react'
import { RefSelectProps, Select as AntSelect, SelectProps } from 'antd'
import { useFormContext } from 'src/context/FormContext'
import { useFormItemContext } from 'src/context/FormItemContext'
import styled from 'styled-components'

const Select = styled(AntSelect)`
  &[aria-readonly='true'] {
    pointer-events: none;
  }
`

export interface CustomSelectProps extends SelectProps {
  width?: string | number
  ref?: React.RefObject<RefSelectProps>
  readonly?: boolean
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  optionLabelProp = 'label',
  showSearch = true,
  readonly,
  width,
  disabled,
  ...props
}) => {
  const context = useFormContext()
  const itemContext = useFormItemContext()

  return (
    <Select
      aria-readonly={readonly}
      disabled={disabled ?? itemContext?.readonly ?? context?.readonly}
      showSearch={showSearch}
      optionLabelProp={optionLabelProp}
      filterOption={(input, option) =>
        Boolean(
          ((option?.label as string) ?? '')
            .toLowerCase()
            .includes(input.toLowerCase())
        )
      }
      style={{ ...props.style, width, minWidth: width }}
      {...props}
    >
      {props.children}
    </Select>
  )
}

export default CustomSelect
