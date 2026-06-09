import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequireAuth } from './components/auth/RequireAuth'
import { LoginPage } from './components/auth/LoginPage'
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './components/auth/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { AgendaPage } from './pages/AgendaPage'
import { TasksPage } from './pages/TasksPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { GoalsPage } from './pages/GoalsPage'
import { HabitsPage } from './pages/HabitsPage'
import { ShoppingPage } from './pages/ShoppingPage'
import { FinancePage } from './pages/FinancePage'
import { InvoicesPage } from './pages/InvoicesPage'
import { NotesPage } from './pages/NotesPage'
import { LibraryPage } from './pages/LibraryPage'
import { StudiesPage } from './pages/StudiesPage'
import { VaultPage } from './pages/VaultPage'
import { SportsPage } from './pages/SportsPage'
import SistemasPage from './pages/SistemasPage'
import { IntegrationsPage } from './pages/IntegrationsPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
      <Route path="/nova-senha" element={<ResetPasswordPage />} />
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
        <Route path="tarefas" element={<TasksPage />} />
        <Route path="projetos" element={<ProjectsPage />} />
        <Route path="metas" element={<GoalsPage />} />
        <Route path="habitos" element={<HabitsPage />} />
        <Route path="compras" element={<ShoppingPage />} />
        <Route path="financeiro" element={<FinancePage />} />
        <Route path="faturamento" element={<InvoicesPage />} />
        <Route path="notas" element={<NotesPage />} />
        <Route path="biblioteca" element={<LibraryPage />} />
        <Route path="estudos" element={<StudiesPage />} />
        <Route path="senhas" element={<VaultPage />} />
        <Route path="esportes" element={<SportsPage />} />
        <Route path="sistemas" element={<SistemasPage />} />
        <Route path="integracoes" element={<IntegrationsPage />} />
        <Route path="perfil" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}
