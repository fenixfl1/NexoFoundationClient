import React from 'react'
import ErrorPageLayout, { StatusErrorPageProps } from './error-page-layout'
import RootTemplate from './template'
import { HomeOutlined } from '@ant-design/icons'
import CustomButton from 'src/components/custom/CustomButton'

const NotFound: React.FC<StatusErrorPageProps> = ({ error }) => {
  return (
    <RootTemplate>
      <ErrorPageLayout
        status="404"
        title="404"
        subTitle="No pudimos encontrar la página que estás buscando."
        error={error}
        actions={
          <CustomButton
            icon={<HomeOutlined />}
            type="link"
            onClick={() => (window.location.href = '/')}
          >
            Ir a inicio
          </CustomButton>
        }
      />
    </RootTemplate>
  )
}

export default NotFound
