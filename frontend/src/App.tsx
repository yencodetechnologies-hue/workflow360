import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/nav/AppShell'
import { DashboardPage } from './pages/Dashboard'
import { DeliveriesListPage } from './pages/Deliveries/List'
import { GodownsDetailsPage } from './pages/Godowns/Details'
import { GodownsListPage } from './pages/Godowns/List'
import { LoginPage } from './pages/Login'
import { BillersPage } from './pages/Masters/Billers'
import { DeliveryPersonsPage } from './pages/Masters/DeliveryPersons'
import { VehiclesPage } from './pages/Masters/Vehicles'
import { ProductsListPage } from './pages/Products/List'
import { ReportsPage } from './pages/Reports'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/godowns" element={<GodownsListPage />} />
        <Route path="/godowns/:id" element={<GodownsDetailsPage />} />
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/deliveries" element={<DeliveriesListPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/masters/billers" element={<BillersPage />} />
        <Route path="/masters/delivery-persons" element={<DeliveryPersonsPage />} />
        <Route path="/masters/vehicles" element={<VehiclesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
