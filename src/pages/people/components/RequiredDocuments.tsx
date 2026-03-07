import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { DeleteOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/lib/table'
import { UploadChangeParam, UploadFile } from 'antd/lib/upload/interface'
import CustomAlert from 'src/components/custom/CustomAlert'
import CustomButton from 'src/components/custom/CustomButton'
import CustomCol from 'src/components/custom/CustomCol'
import { CustomText } from 'src/components/custom/CustomParagraph'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomSpin from 'src/components/custom/CustomSpin'
import CustomTable from 'src/components/custom/CustomTable'
import CustomTooltip from 'src/components/custom/CustomTooltip'
import CustomUpload from 'src/components/custom/CustomUpload'
import { Requirement } from 'src/services/requirements/requirement.types'
import { StudentDocument } from 'src/services/student-documents/student-document.types'
import { useGetRequirementPaginationMutation } from 'src/services/requirements/useGetRequirementPaginationMutation'
import { getBase64 } from 'src/utils/base64-helpers'

export interface DocPayload {
  REQUIREMENT_ID: number
  FILE_NAME: string
  MIME_TYPE: string
  FILE_BASE64: string
  SIGNED_BASE64?: string
  SIGNED_AT?: string
}

interface RequiredDocumentsProps {
  initialDocuments?: StudentDocument[]
  onChange?: (docs: Record<number, DocPayload>, required: Requirement[]) => void
}

const UploadCell = styled.div`
  min-width: 240px;

  .docs-upload .ant-upload-select {
    width: 100%;
  }

  .docs-upload .ant-upload-list {
    margin-top: 8px;
  }
`

const RequiredDocuments: React.FC<RequiredDocumentsProps> = ({
  onChange,
  initialDocuments = [],
}) => {
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
  }, [docs, requirements, onChange])

  useEffect(() => {
    if (!requirements.length) return

    const hasFiles =
      Object.keys(fileLists).length > 0 || Object.keys(docs).length > 0
    if (hasFiles) return

    const normalize = (value?: string | null) =>
      String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')

    const activeDocuments = (initialDocuments ?? []).filter(
      (doc) => (doc.STATE ?? 'A') === 'A'
    )

    if (!activeDocuments.length) return

    const docsByType = new Map(
      activeDocuments.map((doc) => [normalize(doc.DOCUMENT_TYPE), doc])
    )

    const seededDocs: Record<number, DocPayload> = {}
    const seededLists: Record<number, UploadFile[]> = {}

    requirements.forEach((req) => {
      const current =
        docsByType.get(normalize(req.REQUIREMENT_KEY)) ??
        docsByType.get(normalize(req.NAME)) ??
        docsByType.get(normalize(`REQ-${req.REQUIREMENT_ID}`))

      if (!current?.FILE_BASE64) return

      seededDocs[req.REQUIREMENT_ID] = {
        REQUIREMENT_ID: req.REQUIREMENT_ID,
        FILE_NAME: current.FILE_NAME,
        MIME_TYPE: current.MIME_TYPE,
        FILE_BASE64: current.FILE_BASE64,
        SIGNED_BASE64: current.SIGNED_BASE64 ?? undefined,
        SIGNED_AT: current.SIGNED_AT ?? undefined,
      }

      seededLists[req.REQUIREMENT_ID] = [
        {
          uid: `existing-${req.REQUIREMENT_ID}`,
          name: current.FILE_NAME,
          status: 'done',
          type: current.MIME_TYPE,
        },
      ]
    })

    if (!Object.keys(seededDocs).length) return

    setDocs(seededDocs)
    setFileLists(seededLists)
  }, [requirements, initialDocuments])

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
      return
    }

    if (!list.length) {
      setDocs((prev) => {
        const next = { ...prev }
        delete next[requirementId]
        return next
      })
    }
  }

  const handleRemoveFile = (requirementId: number) => {
    setFileLists((prev) => ({ ...prev, [requirementId]: [] }))
    setDocs((prev) => {
      const next = { ...prev }
      delete next[requirementId]
      return next
    })
  }

  const columns: ColumnsType<Requirement> = useMemo(
    () => [
      {
        title: 'ID',
        key: 'ID',
        width: 70,
        align: 'center',
        render: (_, __, index) => index + 1,
      },
      {
        title: 'Documentos',
        dataIndex: 'NAME',
        key: 'NAME',
        render: (_, req) => (
          <CustomSpace direction="vertical" size={0}>
            <CustomText strong>{req.NAME}</CustomText>
            <CustomText type="secondary">{req.DESCRIPTION || '—'}</CustomText>
            <CustomText type={req.IS_REQUIRED ? 'danger' : 'secondary'}>
              {req.IS_REQUIRED ? 'Requerido' : 'Opcional'}
            </CustomText>
          </CustomSpace>
        ),
      },
      {
        title: 'Archivo',
        key: 'FILE',
        width: 320,
        render: (_, req) => (
          <UploadCell>
            <div className="docs-upload">
              <CustomUpload
                listType={'text'}
                accept={'application/pdf,image/*'}
                label={'Cargar'}
                fileList={fileLists[req.REQUIREMENT_ID] ?? []}
                showUploadList={{
                  showPreviewIcon: false,
                  showRemoveIcon: false,
                }}
                onChange={(info) => handleUploadChange(req.REQUIREMENT_ID, info)}
              />
            </div>
          </UploadCell>
        ),
      },
      {
        title: 'Acciones',
        key: 'ACTIONS',
        width: 100,
        align: 'center',
        render: (_, req) => (
          <CustomTooltip title="Quitar archivo">
            <CustomButton
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={!docs[req.REQUIREMENT_ID]}
              onClick={() => handleRemoveFile(req.REQUIREMENT_ID)}
            />
          </CustomTooltip>
        ),
      },
    ],
    [docs, fileLists]
  )

  return (
    <CustomSpin spinning={isPending}>
      <CustomCol xs={24}>
        <CustomAlert
          type="info"
          message={`Documentos requeridos (${requiredCount} obligatorios)`}
          showIcon
          style={{ marginBottom: 12 }}
        />
        <CustomTable
          rowKey={'REQUIREMENT_ID'}
          columns={columns}
          dataSource={requirements}
          pagination={false}
          size={'middle'}
        />
      </CustomCol>
    </CustomSpin>
  )
}

export default RequiredDocuments
