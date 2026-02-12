/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import CustomInput, { CustomInputProps } from './CustomInput'
import { useFormContext } from 'src/context/FormContext'
import { useFormItemContext } from 'src/context/FormItemContext'
import useMaskInput from 'src/hooks/use-mask-input'
import { regexp } from 'src/constants/general'
import { MaskType } from 'src/types/general'

const rules: any = {
  document: [
    {
      mask: '000-0000000-0',
      lazy: true,
      placeholderChar: '-',
      type: 'cedula',
      replace: (value: string) =>
        value.replace(regexp.CUDULA[0], regexp.CUDULA[1]),
    },
    {
      mask: '*****************',
      lazy: true,
      placeholderChar: '-',
      type: 'cedula_rnc',
      replace: (value: string) => {
        return isNaN(Number(value))
          ? value
          : value.length <= 9
          ? value?.replace(regexp.RNC[0], regexp.RNC[1])
          : value.length > 11
          ? value?.replace(regexp.BOOK_FOLIO_ACT[0], regexp.BOOK_FOLIO_ACT[1])
          : value?.replace(regexp.CUDULA[0], regexp.CUDULA[1])
      },
    },
    {
      mask: '0-00-00000-0',
      lazy: true,
      placeholderChar: '-',
      type: 'rnc',
      replace: (value: string) => value.replace(regexp.RNC[0], regexp.RNC[1]),
    },
    {
      mask: 'aa00000000',
      lazy: true,
      placeholderChar: '',
      type: 'passport',
      replace: (value: string) => value.toUpperCase(),
    },
  ],

  phone: [
    {
      mask: '(000) 000-0000',
      lazy: true,
      placeholderChar: '',
      type: 'phone',
      replace: (rawValue: string) => {
        const digits = rawValue.replace(/\D/g, '').slice(0, 10)
        return digits.replace(/(\d{0,3})(\d{0,3})(\d{0,4})/, (_, a, b, c) => {
          if (!a && !b && !c) return ''
          if (digits.length <= 3) return `(${a}`
          if (digits.length <= 6) return `(${a}) ${b}`
          return `(${a}) ${b}-${c}`
        })
      },
    },
  ],
}

type CustomMaskedInputProps = Omit<CustomInputProps, 'type'> & {
  type: keyof MaskType
  variante?: string
  /** @deprecated */
  prefix?: string & React.ReactNode
  /** @deprecated */
  mask?: any
  readonly?: boolean
}

const CustomMaskedInput: React.FC<CustomMaskedInputProps> = ({
  type,
  variante = 'cedula',
  readonly,
  ...props
}) => {
  const { name } = useFormItemContext()
  const { name: formName, form } = useFormContext()
  const normalizedName = Array.isArray(name) ? name.join('_') : name ?? 'input'
  const inputId = props.id ?? `${formName}_${normalizedName}`

  // Asegura que siempre haya reglas de máscara válidas
  const maskRule = rules[type as never] ?? rules.document

  useMaskInput({
    id: inputId,
    args: {
      mask: maskRule,
      dispatch: (append, dynamicMasked) => {
        let value = ''
        const guide = type === ('document' as never) ? variante : type
        const mask =
          dynamicMasked.compiledMasks.find(
            (item) => item?.['type'] === guide
          ) ?? dynamicMasked.compiledMasks?.[0]

        if (variante !== 'passport' && variante !== 'cedula_rnc') {
          value = (dynamicMasked.value + append).replace(/\D/g, '')
        } else {
          value = dynamicMasked.value + append
        }

        const nextValue =
          typeof mask?.['replace'] === 'function'
            ? mask?.['replace']?.(value)
            : dynamicMasked?.value ?? value

        if (typeof nextValue !== 'undefined') {
          form?.setFieldValue?.(name as never, nextValue)
        }
        return (mask ?? dynamicMasked.compiledMasks?.[0]) as never
      },
    },
  })

  return <CustomInput id={inputId} readOnly={readonly} {...props} />
}

export default CustomMaskedInput
