import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RequireAuth } from './components/auth/RequireAuth'
import { RequireAdmin } from './components/auth/RequireAdmin'
import { LoginPage } from './components/auth/LoginPage'
import OnboardingPage from './pages/OnboardingPage'

/* Lazy-loaded routes — split out of the initial bundle so a user who only
   opens Notas isn't forced to download recharts, the Financeiro tabs, etc.
   LoginPage and OnboardingPage stay static: they're the critical entry path
   and should never wait on an extra network round-trip. */
const ForgotPasswordPage = lazy(() => import('./components/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage  = lazy(() => import('./components/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const PrivacyPage        = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const TermsPage          = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })))
const DashboardPage      = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AgendaPage         = lazy(() => import('@/pages/Agenda'))
const TarefasPage        = lazy(() => import('@/pages/Tarefas'))
const ProjectsPage       = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })))
const GoalsPage          = lazy(() => import('./pages/GoalsPage').then(m => ({ default: m.GoalsPage })))
const HabitsPage         = lazy(() => import('./pages/HabitsPage').then(m => ({ default: m.HabitsPage })))
const ShoppingPage       = lazy(() => import('./pages/ShoppingPage').then(m => ({ default: m.ShoppingPage })))
const FinanceiroPage     = lazy(() => import('@/pages/Financeiro/index'))
const InvoicesPage       = lazy(() => import('./pages/InvoicesPage').then(m => ({ default: m.InvoicesPage })))
const NotesPage          = lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })))
const LibraryPage        = lazy(() => import('./pages/LibraryPage').then(m => ({ default: m.LibraryPage })))
const StudiesPage        = lazy(() => import('./pages/StudiesPage').then(m => ({ default: m.StudiesPage })))
const StudyDetailPage    = lazy(() => import('./pages/Estudos/StudyDetailPage').then(m => ({ default: m.StudyDetailPage })))
const VaultPage          = lazy(() => import('./pages/VaultPage').then(m => ({ default: m.VaultPage })))
const SportsPage         = lazy(() => import('./pages/SportsPage').then(m => ({ default: m.SportsPage })))
const SistemasPage       = lazy(() => import('./pages/SistemasPage'))
const WPSpeedAudit       = lazy(() => import('./pages/sistemas/WPSpeedAudit'))
const IntegrationsPage   = lazy(() => import('./pages/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })))
const SettingsPage       = lazy(() => import('./pages/SettingsPage'))
const AdminPage          = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))

function ThemeApplier() {
  useTheme()
  return null
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

export default function App() {
  return (
    <>
    <ThemeApplier />
    <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
      <Route path="/nova-senha" element={<ResetPasswordPage />} />
      <Route path="/privacidade" element={<PrivacyPage />} />
      <Route path="/termos" element={<TermsPage />} />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="tarefas" element={<TarefasPage />} />
        <Route path="projetos" element={<ProjectsPage />} />
        <Route path="metas" element={<GoalsPage />} />
        <Route path="habitos" element={<HabitsPage />} />
        <Route path="compras" element={<ShoppingPage />} />
        <Route path="financeiro" element={<FinanceiroPage />} />
        <Route path="faturamento" element={<RequireAdmin><InvoicesPage /></RequireAdmin>} />
        <Route path="notas" element={<NotesPage />} />
        <Route path="biblioteca" element={<LibraryPage />} />
        <Route path="estudos" element={<StudiesPage />} />
        <Route path="estudos/:studyId" element={<StudyDetailPage />} />
        <Route path="senhas" element={<VaultPage />} />
        <Route path="esportes" element={<SportsPage />} />
        <Route path="sistemas" element={<RequireAdmin><SistemasPage /></RequireAdmin>} />
        <Route path="sistemas/wp-speed-audit" element={<RequireAdmin><WPSpeedAudit /></RequireAdmin>} />
        <Route path="integracoes" element={<IntegrationsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
      </Route>
    </Routes>
    </Suspense>
    </ErrorBoundary>
    </>
  )
}
