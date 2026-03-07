import React, { cloneElement } from 'react'
import { AnyType, TriggersType } from 'src/types/general'
import { CustomModalWarning } from './custom/CustomModalMethods'
import { AppError } from 'src/utils/app-error'

type Triggers = {
  [key in keyof TriggersType]: (e: AnyType) => void
}

interface ConditionalComponentProps extends Triggers {
  condition: boolean | undefined
  children: React.ReactElement
  visible?: boolean
  trigger?: keyof TriggersType
  message?: string
  fallback?: React.ReactNode
}

const ConditionalComponent: React.FC<ConditionalComponentProps> = ({
  condition,
  visible = false,
  trigger = 'onClick',
  message = 'No tienes autorización para ejecutar esta acción',
  fallback,
  ...props
}) => {
  const getCaller = () => {
    try {
      const err = new Error()
      return err.stack?.split('\n').slice(2, 6).join('\n')
    } catch {
      return undefined
    }
  }

  if (!React.isValidElement(props.children)) {
    const caller = process.env.NODE_ENV !== 'production' ? getCaller() : ''
    throw new AppError(
      `[ConditionalComponent] children debe ser un único elemento React válido.`,
      {
        code: 'INVALID_CHILDREN',
        meta: {
          caller,
        },
      }
    )
  }

  const handleTrigger = (e: Event) => {
    e.preventDefault?.()
    if (condition) {
      if (React.isValidElement(props.children)) {
        props?.children?.props?.[trigger]?.(e)
      }
      ;(props as AnyType)?.[trigger]?.(e)
    } else if (visible && message) {
      CustomModalWarning({
        title: 'Aviso',
        content: message,
      })
    }
  }

  const element = condition
    ? cloneElement(props.children as AnyType, {
        [trigger]: handleTrigger,
      })
    : visible && !condition
      ? cloneElement(props.children as AnyType, {
          [trigger]: handleTrigger,
        })
      : fallback

  return <>{element}</>
}

export default ConditionalComponent
