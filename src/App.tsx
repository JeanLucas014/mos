import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequireAuth } from './components/auth/RequireAuth'
import { LoginPage } from './components/auth/LoginPage'
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
import { IntegrationsPage } from './pages/IntegrationsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
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
        <Route path="integracoes" element={<IntegrationsPage />} />
      </Route>
    </Routes>
  )
}
