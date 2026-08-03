import { InboxOutlined } from '@ant-design/icons'
import { DraggerProps, Upload } from 'antd'
import React from 'react'

const { Dragger } = Upload

interface CustomDraggerProps extends DraggerProps {
  label?: string
  description?: string
}

const CustomDragger: React.FC<CustomDraggerProps> = ({
  label = 'Clic o arrastra el archivo a esta área para subirlo',
  description = 'Soporta una carga única. Prohibida estrictamente la subida de datos de la empresa u otros archivos prohibidos.',
  multiple = false,
  action = 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
  ...props
}) => {
  return (
    <Dragger action={action} multiple={multiple} {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">{label}</p>
      <p className="ant-upload-hint">{description}</p>
    </Dragger>
  )
}

export default CustomDragger
