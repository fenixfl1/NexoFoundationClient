import { Form } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import ConditionalComponent from 'src/components/ConditionalComponent'
import CustomTable from 'src/components/custom/CustomTable'
import { Reference } from 'src/services/people/people.types'
import ReferenceForm from './ReferenceForm'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'
import CustomSearch from 'src/components/custom/CustomSearch'
import CustomButton from 'src/components/custom/CustomButton'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import CustomCard from 'src/components/custom/CustomCard'
import { ColumnsType } from 'antd/lib/table'
import formatter from 'src/utils/formatter'
import { useErrorHandler } from 'src/hooks/use-error-handler'
import CustomSpace from 'src/components/custom/CustomSpace'
import CustomDivider from 'src/components/custom/CustomDivider'
import CustomTooltip from 'src/components/custom/CustomTooltip'
import { usePeopleStore } from 'src/store/people.store'
import { useCreateReferenceMutation } from 'src/services/people/useCreateReferenceMutation'
import { useUpdateReferenceMutation } from 'src/services/people/useUpdateReferenceMutation'
import { useCustomModal } from 'src/hooks/use-custom-modal'

interface ReferencesProps {
  value?: Reference[]
  onChange?: (data: Reference[]) => void
}

const References: React.FC<ReferencesProps> = ({ value, onChange }) => {
  const [form] = Form.useForm<{ REFERENCE: Reference }>()

  const [errorHandler] = useErrorHandler()
  const { confirmModal } = useCustomModal()

  const [modalState, setModalState] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number>()
  const [searchKey, setSearchKey] = useState('')
  const [dataSource, setDataSource] = useState<Reference[]>([])

  const { person } = usePeopleStore()
  const { mutateAsync: createReference, isPending: isCreatePending } =
    useCreateReferenceMutation()
  const { mutateAsync: updateReference, isPending: isUpdatePending } =
    useUpdateReferenceMutation()

  const toggleModalState = () => setModalState(!modalState)

  const syncReferences = (nextReferences: Reference[]) => {
    setDataSource(nextReferences)
    onChange?.(nextReferences)
  }

  useEffect(() => {
    if (Array.isArray(value)) {
      setDataSource(value)
      return
    }

    if (person?.PERSON_ID) {
      setDataSource(
        (person.REFERENCES ?? []).filter((item) => item.STATE !== 'I')
      )
    }
  }, [person, value])

  const filteredDataSource = useMemo(() => {
    const normalizedKey = searchKey.trim().toLowerCase()
    if (!normalizedKey) return dataSource

    return dataSource.filter((item) =>
      [item.FULL_NAME, item.RELATIONSHIP, item.PHONE, item.EMAIL, item.ADDRESS]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedKey))
    )
  }, [dataSource, searchKey])

  const handleCreate = async () => {
    try {
      const data = await form.validateFields()
      const nextReference = {
        ...data.REFERENCE,
        PHONE: data.REFERENCE.PHONE.replace(/\D/g, ''),
        PERSON_ID: data.REFERENCE.PERSON_ID ?? person?.PERSON_ID,
        STATE: data.REFERENCE.STATE ?? 'A',
      }

      if (person?.PERSON_ID) {
        if (nextReference.REFERENCE_ID) {
          const updatedReference = await updateReference({
            ...nextReference,
            REFERENCE_ID: nextReference.REFERENCE_ID,
          })

          const nextReferences = dataSource.map((item, index) =>
            index === editingIndex ? updatedReference : item
          )

          syncReferences(nextReferences)
        } else {
          const createdReferences = await createReference(nextReference)
          const createdReference = createdReferences?.[0] ?? nextReference

          syncReferences([...dataSource, createdReference])
        }
      } else if (typeof editingIndex === 'number') {
        const nextReferences = dataSource.map((item, index) =>
          index === editingIndex ? nextReference : item
        )

        syncReferences(nextReferences)
      } else {
        syncReferences([...dataSource, nextReference])
      }

      form.resetFields(['REFERENCE'])
      setEditingIndex(undefined)
      toggleModalState()
    } catch (error) {
      errorHandler(error)
    }
  }

  const handleEdit = (reference: Reference, index: number) => {
    setEditingIndex(index)
    form.setFieldsValue({
      REFERENCE: {
        ...reference,
        PERSON_ID: reference.PERSON_ID ?? person?.PERSON_ID,
      },
    })
    setModalState(true)
  }

  const handleRemove = async (reference: Reference, index: number) => {
    confirmModal({
      title: 'Confirmación',
      content: '¿Seguro que desea remover la referencia?',
      onOk: async () => {
        try {
          if (person?.PERSON_ID && reference.REFERENCE_ID) {
            await updateReference({
              REFERENCE_ID: reference.REFERENCE_ID,
              PERSON_ID: person.PERSON_ID,
              STATE: 'I',
            })
          }

          syncReferences(
            dataSource.filter((_, currentIndex) => currentIndex !== index)
          )
        } catch (error) {
          errorHandler(error)
        }
      },
    })
  }

  const handleClose = () => {
    form.resetFields(['REFERENCE'])
    setEditingIndex(undefined)
    toggleModalState()
  }

  const columns: ColumnsType<Reference> = [
    {
      dataIndex: 'FULL_NAME',
      key: 'FULL_NAME',
      title: 'Nombre',
    },
    {
      dataIndex: 'RELATIONSHIP',
      key: 'RELATIONSHIP',
      title: 'Relación',
    },
    {
      dataIndex: 'PHONE',
      key: 'PHONE',
      title: 'Teléfono',
      render: (value) => formatter({ value, format: 'phone' }),
    },
    {
      dataIndex: 'EMAIL',
      key: 'EMAIL',
      title: 'Correo',
    },
    {
      dataIndex: 'ACTIONS',
      key: 'ACTIONS',
      title: 'Acciones',
      width: '5%',
      align: 'center',
      render: (_, record) => (
        <CustomSpace
          direction={'horizontal'}
          split={<CustomDivider style={{ margin: 0 }} type={'vertical'} />}
        >
          <CustomTooltip title={'Editar'}>
            <CustomButton
              icon={<EditOutlined />}
              type={'link'}
              onClick={() =>
                handleEdit(
                  record,
                  dataSource.findIndex(
                    (item) => item.REFERENCE_ID === record.REFERENCE_ID
                  ) >= 0
                    ? dataSource.findIndex(
                        (item) => item.REFERENCE_ID === record.REFERENCE_ID
                      )
                    : dataSource.findIndex((item) => item === record)
                )
              }
            />
          </CustomTooltip>
          <CustomTooltip title={'Remover'}>
            <CustomButton
              danger
              icon={<DeleteOutlined />}
              type={'link'}
              onClick={() =>
                handleRemove(
                  record,
                  dataSource.findIndex(
                    (item) => item.REFERENCE_ID === record.REFERENCE_ID
                  ) >= 0
                    ? dataSource.findIndex(
                        (item) => item.REFERENCE_ID === record.REFERENCE_ID
                      )
                    : dataSource.findIndex((item) => item === record)
                )
              }
            />
          </CustomTooltip>
        </CustomSpace>
      ),
    },
  ]

  return (
    <>
      <CustomCard>
        <CustomRow justify={'end'} gutter={[16, 16]} gap={10}>
          <CustomCol xs={10}>
            <CustomSearch
              placeholder={'Buscar referencia...'}
              onChange={(event) => setSearchKey(event.target.value)}
            />
          </CustomCol>
          <CustomButton
            icon={<PlusOutlined />}
            type={'primary'}
            onClick={() => {
              form.resetFields(['REFERENCE'])
              setEditingIndex(undefined)
              setModalState(true)
            }}
          >
            Agregar Referencia
          </CustomButton>
          <CustomCol xs={24}>
            <CustomTable columns={columns} dataSource={filteredDataSource} />
          </CustomCol>
        </CustomRow>
      </CustomCard>

      <ConditionalComponent condition={modalState}>
        <ReferenceForm
          form={form}
          open={modalState}
          onClose={handleClose}
          onOk={handleCreate}
          initialValue={
            typeof editingIndex === 'number'
              ? dataSource[editingIndex]
              : undefined
          }
          submitting={isCreatePending || isUpdatePending}
        />
      </ConditionalComponent>
    </>
  )
}

export default References
