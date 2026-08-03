import React from 'react'
import { Modal, ModalProps } from 'antd'
import { CheckOutlined, StopOutlined } from '@ant-design/icons'
import { useCustomModal } from 'src/hooks/use-custom-modal'
import { CustomParagraph } from './CustomParagraph'

const defaultMessage = (
  <CustomParagraph>
    <p>
      Si cierra la ventana perderá cualquier información que haya introducido.{' '}
      <br /> ¿Desea cerrar la ventana?
    </p>
  </CustomParagraph>
)

interface CustomModalProps extends ModalProps {
  preventClose?: boolean
  message?: React.ReactNode
}

const CustomModal: React.FC<CustomModalProps> = ({
  okText = 'Aceptar',
  centered = true,
  cancelText = 'Cancelar',
  okButtonProps,
  cancelButtonProps,
  closable = true,
  onCancel,
  preventClose = true,
  message = defaultMessage,
  ...props
}) => {
  const { confirmModal } = useCustomModal()

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (preventClose) {
      return confirmModal({
        title: 'Confirmación',
        okText: 'Cerrar',
        onOk: onCancel,
        content: message,
      })
    }

    onCancel?.(e)
  }

  return (
    <Modal
      centered={centered}
      onCancel={handleCancel}
      closable={closable}
      cancelButtonProps={{
        icon: <StopOutlined />,
        ...cancelButtonProps,
      }}
      okButtonProps={{
        icon: <CheckOutlined />,
        ...okButtonProps,
      }}
      okText={okText}
      cancelText={cancelText}
      {...props}
    >
      {props.children}
    </Modal>
  )
}

export default CustomModal
