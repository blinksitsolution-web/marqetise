import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from './components/ui'
import { useAuth } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import { can } from './services/api'

const LoginPage = lazy(() => import('./pages/admin/AuthPages').then((module) => ({ default: module.LoginPage })))
const ForgotPasswordPage = lazy(() => import('./pages/admin/AuthPages').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/admin/AuthPages').then((module) => ({ default: module.ResetPasswordPage })))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const CmsListPage = lazy(() => import('./pages/admin/CmsPages').then((module) => ({ default: module.CmsListPage })))
const PageEditorPage = lazy(() => import('./pages/admin/CmsPages').then((module) => ({ default: module.PageEditorPage })))
const CourseAdminListPage = lazy(() => import('./pages/admin/CourseAdminPages').then((module) => ({ default: module.CourseAdminListPage })))
const CourseEditorPage = lazy(() => import('./pages/admin/CourseAdminPages').then((module) => ({ default: module.CourseEditorPage })))
const InquiriesPage = lazy(() => import('./pages/admin/RecordPages').then((module) => ({ default: module.InquiriesPage })))
const InquiryDetailPage = lazy(() => import('./pages/admin/RecordPages').then((module) => ({ default: module.InquiryDetailPage })))
const BookingsPage = lazy(() => import('./pages/admin/RecordPages').then((module) => ({ default: module.BookingsPage })))
const StudentsPage = lazy(() => import('./pages/admin/RecordPages').then((module) => ({ default: module.StudentsPage })))
const StudentProfilePage = lazy(() => import('./pages/admin/RecordPages').then((module) => ({ default: module.StudentProfilePage })))
const UsersPage = lazy(() => import('./pages/admin/AccessPages').then((module) => ({ default: module.UsersPage })))
const PermissionsPage = lazy(() => import('./pages/admin/AccessPages').then((module) => ({ default: module.PermissionsPage })))
const SettingsPage = lazy(() => import('./pages/admin/AccessPages').then((module) => ({ default: module.SettingsPage })))

function RequireAuth({ children, permission }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="grid min-h-screen place-items-center"><Spinner label="Checking your session" /></div>
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (permission && !can(user, permission)) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-semibold">You do not have access to that page</h1>
          <p className="mt-2 text-sm text-muted">Your role is checked on the server as well.</p>
        </div>
      </div>
    )
  }

  return children
}

export default function App() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><Spinner label="Loading page" /></div>}>
      <Routes>
        <Route path="admin/login" element={<LoginPage />} />
        <Route path="admin/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="admin/reset-password" element={<ResetPasswordPage />} />
        <Route path="admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index element={<RequireAuth permission="dashboard.view"><DashboardPage /></RequireAuth>} />
          <Route path="cms" element={<RequireAuth permission="content.view"><CmsListPage /></RequireAuth>} />
          <Route path="cms/pages/new" element={<RequireAuth permission="content.manage"><PageEditorPage /></RequireAuth>} />
          <Route path="cms/pages/:id" element={<RequireAuth permission="content.manage"><PageEditorPage /></RequireAuth>} />
          <Route path="courses" element={<RequireAuth permission="courses.view"><CourseAdminListPage /></RequireAuth>} />
          <Route path="courses/new" element={<RequireAuth permission="courses.manage"><CourseEditorPage /></RequireAuth>} />
          <Route path="courses/:id" element={<RequireAuth permission="courses.manage"><CourseEditorPage /></RequireAuth>} />
          <Route path="inquiries" element={<RequireAuth permission="inquiries.view"><InquiriesPage /></RequireAuth>} />
          <Route path="inquiries/:id" element={<RequireAuth permission="inquiries.view"><InquiryDetailPage /></RequireAuth>} />
          <Route path="bookings" element={<RequireAuth permission="bookings.view"><BookingsPage /></RequireAuth>} />
          <Route path="students" element={<RequireAuth permission="students.view"><StudentsPage /></RequireAuth>} />
          <Route path="students/:id" element={<RequireAuth permission="students.view"><StudentProfilePage /></RequireAuth>} />
          <Route path="users" element={<RequireAuth permission="users.view"><UsersPage /></RequireAuth>} />
          <Route path="permissions" element={<RequireAuth permission="roles.view"><PermissionsPage /></RequireAuth>} />
          <Route path="settings" element={<RequireAuth permission="settings.view"><SettingsPage /></RequireAuth>} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Suspense>
  )
}
