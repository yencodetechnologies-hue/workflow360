// import { Navigate, Route, Routes } from 'react-router-dom'
// import { AppShell } from './components/nav/AppShell'
// import { ProtectedRoute } from './auth/ProtectedRoute'
// import { DashboardPage } from './pages/Dashboard'
// import { DeliveriesListPage } from './pages/Deliveries/List'
// import { DeliveryDetailPage } from './pages/Deliveries/Detail'
// import { PublicDeliveryVerifyPage } from './pages/Public/DeliveryVerify'
// import { PublicBillerReturnPage } from './pages/Public/BillerReturn'
// import { GodownsDetailsPage } from './pages/Godowns/Details'
// import { GodownsListPage } from './pages/Godowns/List'
// import { GodownRouteGuard } from './pages/GodownRouteGuard'
// import { LoginPage } from './pages/Login'
// import { BillersPage } from './pages/Masters/Billers'
// import { DeliveryPersonsPage } from './pages/Masters/DeliveryPersons'
// import { ProductsGodownRedirect } from './pages/ProductsGodownRedirect'
// import { CalendarPage } from './pages/Calendar'
// import { ReportsPage } from './pages/Reports'
// import { QueuePage } from './pages/Queue'
// import { OrdersListPage } from './pages/Orders/List'
// import { ScanDeliveryPage } from './pages/Scan/ScanDelivery'
// import { AdminEditProfilePage } from './pages/Editprofile'
// import { ActivityLogsPage } from './pages/ActivityLogs'

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/p/delivery/:token" element={<PublicDeliveryVerifyPage />} />
//       <Route path="/p/biller/:token" element={<PublicBillerReturnPage />} />

//       <Route element={<ProtectedRoute />}>
//         <Route element={<AppShell />}>
//           <Route index element={<DashboardPage />} />
//           <Route path="/editprofile" element={<AdminEditProfilePage />} />

//           <Route
//             path="/queue"
//             element={
//               <ProtectedRoute roles={['ADMIN']}>
//                 <QueuePage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/orders"
//             element={
//               <ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']}>
//                 <OrdersListPage />
//               </ProtectedRoute>
//             }
//           />

//           <Route element={<ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']} />}>
//             <Route element={<GodownRouteGuard />}>
//               <Route path="/godowns" element={<GodownsListPage />} />
//               <Route path="/godowns/:id" element={<GodownsDetailsPage />} />
//             </Route>
//           </Route>

//           <Route
//             path="/products"
//             element={
//               <ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']}>
//                 <ProductsGodownRedirect />
//               </ProtectedRoute>
//             }
//           />
//           <Route path="/deliveries" element={<DeliveriesListPage />} />
//           <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />
//           <Route path="/scan/dispatch/:id" element={<ScanDeliveryPage action="dispatch" />} />
//           <Route path="/scan/pickup/:id" element={<ScanDeliveryPage action="pickup" />} />
//           <Route path="/scan/deliver/:id" element={<ScanDeliveryPage action="deliver" />} />
//           <Route path="/scan/return/:id" element={<ScanDeliveryPage action="return" />} />
//           <Route path="/scan/return-pickup/:id" element={<ScanDeliveryPage action="return-pickup" />} />
//           <Route
//             path="/calendar"
//             element={
//               <ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']}>
//                 <CalendarPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/reports"
//             element={
//               <ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']}>
//                 <ReportsPage />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/masters/billers"
//             element={
//               <ProtectedRoute roles={['ADMIN', 'BILLER']}>
//                 <BillersPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/masters/delivery-persons"
//             element={
//               <ProtectedRoute roles={['ADMIN']}>
//                 <DeliveryPersonsPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/activity-logs"
//             element={
//               <ProtectedRoute roles={['ADMIN']}>
//                 <ActivityLogsPage />
//               </ProtectedRoute>
//             }
//           />
//         </Route>
//       </Route>

//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   )
// }


import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/nav/AppShell'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { DashboardPage } from './pages/Dashboard'
import { DeliveriesListPage } from './pages/Deliveries/List'
import { DeliveryDetailPage } from './pages/Deliveries/Detail'
import { PublicDeliveryVerifyPage } from './pages/Public/DeliveryVerify'
import { PublicBillerReturnPage } from './pages/Public/BillerReturn'
import { GodownsDetailsPage } from './pages/Godowns/Details'
import { GodownsListPage } from './pages/Godowns/List'
import { GodownRouteGuard } from './pages/GodownRouteGuard'
import { LoginPage } from './pages/Login'
import { BillersPage } from './pages/Masters/Billers'
import { DeliveryPersonsPage } from './pages/Masters/DeliveryPersons'
import { ProductsGodownRedirect } from './pages/ProductsGodownRedirect'
import { ProductReportPage } from './pages/Products/Report'
import { CalendarPage } from './pages/Calendar'
import { ReturnDeliveryCalendarPage } from './pages/ReturnDeliveryCalendar' // ← NEW
import { ReportsPage } from './pages/Reports'
import { QueuePage } from './pages/Queue'
import { OrdersListPage } from './pages/Orders/List'
import { ScanDeliveryPage } from './pages/Scan/ScanDelivery'
import { AdminEditProfilePage } from './pages/Editprofile'
import { ActivityLogsPage } from './pages/ActivityLogs'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/p/delivery/:token" element={<PublicDeliveryVerifyPage />} />
      <Route path="/p/biller/:token" element={<PublicBillerReturnPage />} />
      <Route path="/p/pending-return/:token" element={<PublicBillerReturnPage mode="pendingReturnAssign" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/editprofile" element={<AdminEditProfilePage />} />

          <Route
            path="/queue"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <QueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']}>
                <OrdersListPage />
              </ProtectedRoute>
            }
          />

          <Route element={<ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']} />}>
            <Route element={<GodownRouteGuard />}>
              <Route path="/godowns" element={<GodownsListPage />} />
              <Route path="/godowns/:id" element={<GodownsDetailsPage />} />
            </Route>
          </Route>

          <Route
            path="/products"
            element={
              <ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']}>
                <ProductsGodownRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/report"
            element={
              <ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']}>
                <ProductReportPage />
              </ProtectedRoute>
            }
          />
          <Route path="/deliveries" element={<DeliveriesListPage />} />
          <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />
          <Route path="/scan/dispatch/:id" element={<ScanDeliveryPage action="dispatch" />} />
          <Route path="/scan/pickup/:id" element={<ScanDeliveryPage action="pickup" />} />
          <Route path="/scan/deliver/:id" element={<ScanDeliveryPage action="deliver" />} />
          <Route path="/scan/return/:id" element={<ScanDeliveryPage action="return" />} />
          <Route path="/scan/return-pickup/:id" element={<ScanDeliveryPage action="return-pickup" />} />

          {/* ── Calendar routes ── */}
          <Route
            path="/calendar"
            element={
              <ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']}>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          {/* NEW: Return Calendar — tracks partial returns and re-delivery scheduling */}
          <Route
            path="/return-calendar"
            element={
              <ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']}>
                <ReturnDeliveryCalendarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={['ADMIN', 'BILLER', 'GODOWN']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/masters/billers"
            element={
              <ProtectedRoute roles={['ADMIN', 'BILLER']}>
                <BillersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/masters/delivery-persons"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <DeliveryPersonsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity-logs"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <ActivityLogsPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
