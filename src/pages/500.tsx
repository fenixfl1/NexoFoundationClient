import React from 'react'
import ErrorPageLayout, { StatusErrorPageProps } from './error-page-layout'

const InternalServerError: React.FC<StatusErrorPageProps> = ({ error }) => {
  return (
    <ErrorPageLayout
      status="500"
      title="500"
      error={error}
      subTitle={
        error?.['message'] ??
        'Ocurrió un error inesperado. Intenta nuevamente en unos momentos.'
      }
    />
  )
}

export default InternalServerError
