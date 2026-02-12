import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import styled, { keyframes } from 'styled-components'
import CustomAvatar from 'src/components/custom/CustomAvatar'
import CustomCard from 'src/components/custom/CustomCard'
import CustomDivider from 'src/components/custom/CustomDivider'
import {
  CustomParagraph,
  CustomText,
  CustomTitle,
} from 'src/components/custom/CustomParagraph'
import CustomButton from 'src/components/custom/CustomButton'
import { getSessionInfo } from 'src/lib/session'
import { getAvatarLink } from 'src/utils/get-avatar-link'
import { ROLE_STUDENT_ID } from 'src/utils/role-path'
import { useGetDashboardMetricsQuery } from 'src/services/dashboard/useGetDashboardMetricsQuery'
import CustomSegmented from 'src/components/custom/CustomSegmented'
import { useMenuOptionStore } from 'src/store/menu-options.store'
import { getRecentMenuOptions } from 'src/utils/recent-menu'
import { useGetDashboardActivityQuery } from 'src/services/dashboard/useGetDashboardActivityQuery'
import formatter from 'src/utils/formatter'
import CustomRow from 'src/components/custom/CustomRow'
import CustomCol from 'src/components/custom/CustomCol'

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const PageWrap = styled.div`
  --panel-bg: ${({ theme }) =>
    theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'};
  --panel-border: ${({ theme }) =>
    theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
  --panel-glow: ${({ theme }) =>
    theme.isDark ? 'rgba(79, 140, 255, 0.12)' : 'rgba(79, 140, 255, 0.08)'};
  --accent: ${({ theme }) => theme.primaryColor};
  --text-soft: ${({ theme }) =>
    theme.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'};

  width: 100%;
  min-height: 100%;
  padding: 12px 32px !important;
  color: ${({ theme }) => theme.colorText};
  font-family: 'Space Grotesk', 'IBM Plex Sans', sans-serif;
  background: ${({ theme }) =>
    theme.isDark
      ? 'radial-gradient(circle at top left, rgba(48, 56, 77, 0.9) 0%, rgba(27, 31, 43, 0.95) 45%, rgba(18, 20, 29, 0.98) 100%)'
      : 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.9) 0%, rgba(244, 246, 250, 0.95) 45%, rgba(236, 238, 244, 0.98) 100%)'};
  border-radius: 18px;
  position: relative;
  overflow: hidden;
  animation: ${fadeUp} 360ms ease-out;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) =>
      theme.isDark
        ? 'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.06), transparent 45%), radial-gradient(circle at 80% 10%, rgba(79, 140, 255, 0.18), transparent 40%)'
        : 'radial-gradient(circle at 20% 20%, rgba(0, 0, 0, 0.04), transparent 45%), radial-gradient(circle at 80% 10%, rgba(79, 140, 255, 0.12), transparent 40%)'};
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`

const Hero = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
`

const HeroMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const AvatarRing = styled.div`
  padding: 6px;
  border-radius: 999px;
  background: ${({ theme }) =>
    theme.isDark
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(79, 140, 255, 0.7))'
      : 'linear-gradient(135deg, rgba(0, 0, 0, 0.08), rgba(79, 140, 255, 0.35))'};
`

const Eyebrow = styled.div`
  color: var(--text-soft);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 6px;
`

const RolePill = styled.span`
  display: inline-flex;
  margin-top: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  background: ${({ theme }) =>
    theme.isDark ? 'rgba(79, 140, 255, 0.18)' : 'rgba(79, 140, 255, 0.16)'};
  color: var(--accent);
  border: 1px solid
    ${({ theme }) =>
      theme.isDark ? 'rgba(79, 140, 255, 0.45)' : 'rgba(79, 140, 255, 0.35)'};
`

const SectionTitle = styled.h3`
  margin: 24px 0 12px;
  font-size: 18px;
  font-weight: 600;
`

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
`

const StatCard = styled(CustomCard)`
  background: var(--panel-bg) !important;
  border: 1px solid var(--panel-border);
  box-shadow:
    0 0 0 1px var(--panel-border),
    0 16px 40px -30px var(--panel-glow);
  border-radius: 16px;
  padding: 18px 20px;
  animation: ${fadeUp} 360ms ease-out both;
`

const StatLabel = styled.div`
  font-size: 13px;
  color: var(--text-soft);
`

const StatValue = styled.div`
  font-size: 26px;
  font-weight: 700;
  margin: 6px 0;
`

const StatCaption = styled.div`
  font-size: 12px;
  color: var(--text-soft);
`

const WideGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
  margin-top: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Panel = styled(CustomCard)`
  background: var(--panel-bg) !important;
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  padding: 20px;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`

const Tag = styled.span`
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ theme }) =>
    theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};
  color: var(--text-soft);
`

const AttentionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
`

const AttentionBadge = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ theme }) =>
    theme.isDark ? 'rgba(45, 196, 140, 0.18)' : 'rgba(45, 196, 140, 0.12)'};
  color: ${({ theme }) => (theme.isDark ? '#59d692' : '#1f8a63')};
  display: grid;
  place-items: center;
  font-weight: 700;
`

const DividerLine = styled.div`
  height: 1px;
  background: var(--panel-border);
  margin: 16px 0;
`

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const QuickList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const QuickItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: ${({ theme }) =>
    theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'};
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }
`

const SmallMuted = styled.div`
  font-size: 12px;
  color: var(--text-soft);
`

const getLastAccessLabel = (touchedAt?: string) => {
  if (!touchedAt) return 'Último acceso reciente'
  const time = new Date(touchedAt)
  const diffMs = Date.now() - time.getTime()
  if (Number.isNaN(time.getTime()) || diffMs < 0) return 'Último acceso reciente'

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Último acceso hace segundos'
  if (minutes < 60)
    return `Último acceso hace ${minutes} minuto${minutes === 1 ? '' : 's'}`

  const hours = Math.floor(minutes / 60)
  if (hours < 24)
    return `Último acceso hace ${hours} hora${hours === 1 ? '' : 's'}`

  const days = Math.floor(hours / 24)
  if (days < 30) return `Último acceso hace ${days} día${days === 1 ? '' : 's'}`

  const months = Math.floor(days / 30)
  if (months < 12)
    return `Último acceso hace ${months} mes${months === 1 ? '' : 'es'}`

  const years = Math.floor(months / 12)
  return `Último acceso hace ${years} año${years === 1 ? '' : 's'}`
}

const Feed = styled.div`
  display: grid;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 24px;
`

const FeedItem = styled.div`
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: ${({ theme }) =>
    theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'};
`

const Dot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 12px
    ${({ theme }) =>
      theme.isDark ? 'rgba(79, 140, 255, 0.55)' : 'rgba(79, 140, 255, 0.4)'};
  margin-top: 6px;
`

const Home: React.FC = () => {
  const { name, roleId } = getSessionInfo()
  const isStudent = String(roleId) === ROLE_STUDENT_ID
  const { data: dashboard } = useGetDashboardMetricsQuery()
  const metrics = dashboard?.metrics ?? {}
  const { data: activity } = useGetDashboardActivityQuery()
  const { menuOptions } = useMenuOptionStore()
  const navigate = useNavigate()
  const [quickTab, setQuickTab] = useState<'Recientes' | 'Pendientes'>(
    'Recientes'
  )

  const flatOptions = useMemo(() => {
    const flatten = (options: typeof menuOptions): typeof menuOptions =>
      options.flatMap((option) => [
        option,
        ...(option.CHILDREN ? flatten(option.CHILDREN) : []),
      ])

    return flatten(menuOptions)
  }, [menuOptions])

  const recentOptions = useMemo(
    () => getRecentMenuOptions(String(roleId), 5),
    [roleId]
  )

  const pendingOptions = useMemo(() => {
    const items = isStudent
      ? [
          {
            label: 'Documentos estudiantiles',
            value: metrics.documentsPending ?? 0,
            pathMatch: 'student_documents',
          },
          {
            label: 'Solicitudes',
            value: metrics.requestsActive ?? 0,
            pathMatch: 'requests',
          },
          {
            label: 'Citas',
            value: metrics.appointmentsUpcoming ?? 0,
            pathMatch: 'appointment',
          },
        ]
      : [
          {
            label: 'Solicitudes',
            value: metrics.requestsPending ?? 0,
            pathMatch: 'requests',
          },
          {
            label: 'Validación de requisitos',
            value: metrics.requirementsPending ?? 0,
            pathMatch: 'requirements_validation',
          },
          {
            label: 'Desembolsos',
            value: metrics.disbursementsPending ?? 0,
            pathMatch: 'scholarships',
          },
        ]

    return items
      .filter((item) => Number(item.value) > 0)
      .map((item) => {
        const menu = flatOptions.find((option) =>
          option.PATH?.includes(item.pathMatch)
        )
        return {
          ...item,
          menu,
        }
      })
  }, [flatOptions, isStudent, metrics])

  const handleNavigate = (path?: string) => {
    if (!path) return
    const basePath = isStudent ? '/student' : '/admin'
    navigate(`${basePath}${path}`)
  }

  const highlights = isStudent
    ? [
        {
          label: 'Documentos pendientes',
          value: String(metrics.documentsPending ?? 0),
          caption: 'Revisar antes de fin de mes',
        },
        {
          label: 'Citas programadas',
          value: String(metrics.appointmentsUpcoming ?? 0),
          caption: 'Próxima esta semana',
        },
        {
          label: 'Solicitudes activas',
          value: String(metrics.requestsActive ?? 0),
          caption: 'En revisión',
        },
        {
          label: 'Promedio actual',
          value: metrics.academicAverage?.toString() ?? '—',
          caption: 'Último semestre',
        },
      ]
    : [
        {
          label: 'Solicitudes nuevas',
          value: String(metrics.requestsPending ?? 0),
          caption: 'Últimas 24 horas',
        },
        {
          label: 'Validaciones pendientes',
          value: String(metrics.requirementsPending ?? 0),
          caption: 'Requieren revisión',
        },
        {
          label: 'Becas activas',
          value: String(metrics.scholarshipsActive ?? 0),
          caption: 'Cohorte vigente',
        },
        {
          label: 'Desembolsos pendientes',
          value: String(metrics.disbursementsPending ?? 0),
          caption: 'Programados',
        },
      ]

  return (
    <PageWrap>
      <Hero>
        <HeroMeta>
          <AvatarRing>
            <CustomAvatar size={68} src={getAvatarLink()} />
          </AvatarRing>
          <div>
            <Eyebrow>Resumen del día</Eyebrow>
            <CustomTitle level={2}>Hola, {name || 'Bienvenido'}</CustomTitle>
            <RolePill>{isStudent ? 'Estudiante' : 'Administrador'}</RolePill>
          </div>
        </HeroMeta>
        <CustomDivider style={{ marginRight: 50 }} />
      </Hero>

      <SectionTitle>Indicadores rápidos</SectionTitle>
      <CardsGrid>
        {highlights.map((item, index) => (
          <StatCard
            key={item.label}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <StatLabel>{item.label}</StatLabel>
            <StatValue>{item.value}</StatValue>
            <StatCaption>{item.caption}</StatCaption>
          </StatCard>
        ))}
      </CardsGrid>

      <WideGrid>
        <Panel>
          <PanelHeader>
            <CustomText strong>Elementos que requieren atención</CustomText>
            <Tag>Semana actual</Tag>
          </PanelHeader>
          <AttentionRow>
            <AttentionBadge>✓</AttentionBadge>
            <div>
              <CustomText strong>Todo al día</CustomText>
              <CustomParagraph>
                No tienes tareas críticas pendientes. Mantén este ritmo.
              </CustomParagraph>
            </div>
          </AttentionRow>
          <DividerLine />
          <ActionRow>
            <CustomText>Ver detalles</CustomText>
            <CustomButton type="link">Ir al tablero</CustomButton>
          </ActionRow>
        </Panel>

        <Panel>
          <PanelHeader>
            <CustomRow justify={'end'}>
              <CustomCol xs={24}>
                <CustomText style={{ whiteSpace: 'nowrap' }} strong>
                  Accesos rápidos
                </CustomText>
              </CustomCol>
              <CustomSegmented
                options={['Recientes', 'Pendientes']}
                value={quickTab}
                onChange={setQuickTab}
              />
            </CustomRow>
          </PanelHeader>
          <QuickList>
            {quickTab === 'Recientes' &&
              (recentOptions.length ? (
                recentOptions.map((option) => (
                  <QuickItem
                    key={option.MENU_OPTION_ID}
                    onClick={() => handleNavigate(option.PATH)}
                    role="button"
                  >
                    <span>{option.NAME}</span>
                    <SmallMuted>{getLastAccessLabel(option.touchedAt)}</SmallMuted>
                  </QuickItem>
                ))
              ) : (
                <QuickItem>
                  <span>No hay accesos recientes</span>
                  <SmallMuted>Visita módulos para verlos aquí.</SmallMuted>
                </QuickItem>
              ))}

            {quickTab === 'Pendientes' &&
              (pendingOptions.length ? (
                pendingOptions.map((item) => (
                  <QuickItem
                    key={item.pathMatch}
                    onClick={() => handleNavigate(item.menu?.PATH)}
                    role="button"
                  >
                    <span>{item.label}</span>
                    <SmallMuted>{item.value} pendientes</SmallMuted>
                  </QuickItem>
                ))
              ) : (
                <QuickItem>
                  <span>Sin pendientes</span>
                  <SmallMuted>Todo al día.</SmallMuted>
                </QuickItem>
              ))}
          </QuickList>
        </Panel>
      </WideGrid>

      <SectionTitle>Actualizaciones recientes</SectionTitle>
      <Feed>
        {activity?.length ? (
          activity.map((item, index) => (
            <FeedItem key={`${item.type}-${index}`}>
              <Dot />
              <div>
                <CustomText strong>{item.title}</CustomText>
                <SmallMuted>
                  {formatter({ value: item.occurred_at, format: 'datetime' })} ·{' '}
                  {item.description}
                </SmallMuted>
              </div>
            </FeedItem>
          ))
        ) : (
          <FeedItem>
            <Dot />
            <div>
              <CustomText strong>Sin actividad reciente</CustomText>
              <SmallMuted>Las acciones aparecerán aquí.</SmallMuted>
            </div>
          </FeedItem>
        )}
      </Feed>
    </PageWrap>
  )
}

export default Home
