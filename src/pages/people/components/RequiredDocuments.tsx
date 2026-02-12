import React, { useEffect, useMemo, useState } from 'react'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomCard from 'src/components/custom/CustomCard'
import CustomDivider from 'src/components/custom/CustomDivider'
import { CustomText } from 'src/components/custom/CustomParagraph'
import CustomUpload from 'src/components/custom/CustomUpload'
import CustomAlert from 'src/components/custom/CustomAlert'
import { Requirement } from 'src/services/requirements/requirement.types'
import { useGetRequirementPaginationMutation } from 'src/services/requirements/useGetRequirementPaginationMutation'
import { UploadChangeParam, UploadFile } from 'antd/lib/upload/interface'
import { getBase64 } from 'src/utils/base64-helpers'
import CustomSpin from 'src/components/custom/CustomSpin'

export interface DocPayload {
  REQUIREMENT_ID: number
  FILE_NAME: string
  MIME_TYPE: string
  FILE_BASE64: string
  SIGNED_BASE64?: string
  SIGNED_AT?: string
}

interface RequiredDocumentsProps {
  onChange?: (docs: Record<number, DocPayload>, required: Requirement[]) => void
}

const RequiredDocuments: React.FC<RequiredDocumentsProps> = ({ onChange }) => {
  const [docs, setDocs] = useState<Record<number, DocPayload>>({})
  const [fileLists, setFileLists] = useState<Record<number, UploadFile[]>>({})
  const { mutateAsync: getRequirements, isPending } =
    useGetRequirementPaginationMutation()

  const [requirements, setRequirements] = useState<Requirement[]>([])

  useEffect(() => {
    getRequirements({
      page: 1,
      size: 50,
      condition: [
        {
          value: 'A',
          field: 'STATE',
          operator: '=',
        },
      ],
    }).then((resp) => {
      if (resp?.data) setRequirements(resp.data as Requirement[])
    })
  }, [getRequirements])

  useEffect(() => {
    onChange?.(docs, requirements)
  }, [docs, requirements])

  const requiredCount = useMemo(
    () => requirements.filter((r) => r.IS_REQUIRED).length,
    [requirements]
  )

  const handleUploadChange = async (
    requirementId: number,
    info: UploadChangeParam<UploadFile<unknown>>
  ) => {
    const list = info.fileList.slice(-1)
    setFileLists((prev) => ({ ...prev, [requirementId]: list }))

    const current = list?.[0]
    if (current?.originFileObj) {
      const base64 = (await getBase64(current.originFileObj as File)) as string
      setDocs((prev) => ({
        ...prev,
        [requirementId]: {
          REQUIREMENT_ID: requirementId,
          FILE_NAME: current.name,
          MIME_TYPE: current.type,
          FILE_BASE64: base64 as string,
        },
      }))
    }
  }

  return (
    <CustomSpin spinning={isPending}>
      <CustomCol xs={24}>
        <CustomAlert
          type="info"
          message={`Documentos requeridos (${requiredCount} obligatorios)`}
          showIcon
          style={{ marginBottom: 12 }}
        />
        <CustomRow gutter={[12, 12]}>
          {requirements.map((req) => (
            <CustomCol key={req.REQUIREMENT_ID} xs={24} md={12} lg={8}>
              <CustomCard height={'100%'} size="small" shadow>
                <CustomDivider>
                  <CustomText strong>{req.NAME}</CustomText>{' '}
                  {req.IS_REQUIRED ? (
                    <CustomText type="danger">(Requerido)</CustomText>
                  ) : null}
                </CustomDivider>
                <CustomText type="secondary">
                  {req.DESCRIPTION || '—'}
                </CustomText>
                <CustomUpload
                  listType={'text'}
                  accept={'application/pdf,image/*'}
                  fileList={fileLists[req.REQUIREMENT_ID] ?? []}
                  onChange={(info) =>
                    handleUploadChange(req.REQUIREMENT_ID, info)
                  }
                />
              </CustomCard>
            </CustomCol>
          ))}
        </CustomRow>
      </CustomCol>
    </CustomSpin>
  )
}

export default RequiredDocuments
