import { Form, FormInstance } from 'antd'
import React from 'react'
import CatalogSelector from 'src/components/CatalogSelector'
import ConditionalComponent from 'src/components/ConditionalComponent'
import CustomCol from 'src/components/custom/CustomCol'
import CustomFormItem from 'src/components/custom/CustomFormItem'
import CustomInputNumber from 'src/components/custom/CustomInputNumber'
import CustomRow from 'src/components/custom/CustomRow'
import { defaultBreakpoints } from 'src/config/breakpoints'
import { PersonPayload } from 'src/services/people/people.types'
import { ScholarshipStatus } from 'src/services/students/student.types'

interface StudentDataProps {
  form?: FormInstance<PersonPayload>
}

const StudentData: React.FC<StudentDataProps> = ({ form }) => {
  const university = Form.useWatch(['STUDENT', 'UNIVERSITY'], form)

  return (
    <CustomRow justify={'start'}>
      <CustomFormItem hidden name={['STUDENT', 'STUDENT_ID']} />
      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Universidad'}
          name={['STUDENT', 'UNIVERSITY']}
          rules={[{ required: true }]}
        >
          <CatalogSelector
            catalog={'ID_LIST_UNIVERSITIES'}
            placeholder={'Seleccionar universidad'}
          />
        </CustomFormItem>
      </CustomCol>

      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem label={'Campus'} name={['STUDENT', 'CAMPUS']}>
          <CatalogSelector
            catalog={'ID_LIST_CAMPUSES'}
            disabled={!university}
            placeholder={'Seleccionar campus'}
            filter={(option) => option.EXTRA?.['university'] === university}
          />
        </CustomFormItem>
      </CustomCol>

      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Programa académico'}
          name={['STUDENT', 'CAREER']}
          rules={[{ required: true }]}
        >
          <CatalogSelector
            catalog={'ID_LIST_CAREERS'}
            placeholder={'Seleccionar programa'}
          />
        </CustomFormItem>
      </CustomCol>

      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Estado de beca'}
          name={['STUDENT', 'SCHOLARSHIP_STATUS']}
          initialValue={ScholarshipStatus.PENDING}
          rules={[{ required: true }]}
        >
          <CatalogSelector
            catalog={'ID_LIST_STUDENT_STATES'}
            placeholder={'Seleccionar estado'}
          />
        </CustomFormItem>
      </CustomCol>

      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Indice académico'}
          name={['STUDENT', 'ACADEMIC_AVERAGE']}
          initialValue={0}
        >
          <CustomInputNumber
            min={0}
            max={100}
            precision={2}
            step={0.01}
            style={{ width: '100%' }}
          />
        </CustomFormItem>
      </CustomCol>

      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Cohorte'}
          name={['STUDENT', 'COHORT']}
          tooltip={
            'Sirve para agrupar y reportar estudiantes por generación o convocatoria especifica.'
          }
        >
          <CatalogSelector
            catalog={'ID_LIST_COHORTS'}
            placeholder={'Seleccionar cohorte'}
          />
        </CustomFormItem>
      </CustomCol>

      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Horas requeridas'}
          name={['STUDENT', 'HOURS_REQUIRED']}
          initialValue={0}
        >
          <CustomInputNumber min={0} precision={0} style={{ width: '100%' }} />
        </CustomFormItem>
      </CustomCol>

      <ConditionalComponent condition={false}>
        <CustomCol {...defaultBreakpoints}>
          <CustomFormItem
            label={'Horas completadas'}
            name={['STUDENT', 'HOURS_COMPLETED']}
            initialValue={0}
          >
            <CustomInputNumber
              placeholder={'0.00'}
              min={0}
              precision={0}
              style={{ width: '100%' }}
            />
          </CustomFormItem>
        </CustomCol>
      </ConditionalComponent>

      <CustomCol {...defaultBreakpoints}>
        <CustomFormItem
          label={'Puntaje de ingreso'}
          name={['STUDENT', 'SCORE']}
        >
          <CustomInputNumber
            placeholder={'000'}
            min={0}
            max={100}
            precision={0}
            style={{ width: '100%' }}
          />
        </CustomFormItem>
      </CustomCol>
    </CustomRow>
  )
}

export default StudentData
