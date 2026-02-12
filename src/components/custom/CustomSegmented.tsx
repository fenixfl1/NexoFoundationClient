/* eslint-disable @typescript-eslint/no-explicit-any */
import { Segmented as AntSegmented, SegmentedProps } from 'antd'
import { SegmentedValue } from 'antd/es/segmented'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

interface CustomSegmentedProps extends Omit<SegmentedProps, 'onChange'> {
  onChange?: (value: any) => void
}

const Segmented = styled(AntSegmented)<SegmentedProps>`
  background-color: ${({ theme }) => theme.colorBgContainer} !important;
  .ant-segmented-item-label {
    width: max-content;
  }
`

const CustomSegmented = React.forwardRef<HTMLDivElement, CustomSegmentedProps>(
  ({ block = true, value = '', onChange, ...props }, ref) => {
    const [currentValue, setCurrentValue] = useState<SegmentedValue>()

    useEffect(() => {
      setCurrentValue(value)
    }, [value])

    return (
      <Segmented
        ref={ref}
        block={block}
        value={currentValue}
        onChange={onChange}
        {...props}
      />
    )
  }
)

export default CustomSegmented
