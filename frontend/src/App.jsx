import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import SuppliersPage from "./pages/SuppliersPage";
import PurchasingDashboard from "./pages/PurchasingDashboard";
import HomePage from "./pages/HomePage";
import PlanningModulePage from "./pages/PlanningModulePage";
import ForecastPage from "./pages/ForecastPage";
import RequirementsPage from "./pages/RequirementsPage";
import ImportPage from "./pages/ImportPage";
import BOMPage from "./pages/BOMPage";
import Sidebar from "./components/Sidebar";
import { useEffect, useState } from 'react'
import './App.css'

const API = '/api'

function App() {
  const [page, setPage] = useState('home')
  const [forecastRows, setForecastRows] = useState(() => {
    try {
      const saved = window.localStorage.getItem('forecastRows')
      if (!saved) return [{ productId: '', productName: '', quantity: '' }]
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) && parsed.length ? parsed : [{ productId: '', productName: '', quantity: '' }]
    } catch {
      return [{ productId: '', productName: '', quantity: '' }]
    }
  })

  useEffect(() => {
    window.localStorage.setItem('forecastRows', JSON.stringify(forecastRows))
  }, [forecastRows])

  return (
    <div className="app-layout">
      <Sidebar setPage={setPage} />
      <main className="main-content">
        
{page==='home' && <HomePage setPage={setPage} />}
{page==='planning' && <PlanningModulePage setPage={setPage} />}
{page==='purchasing' && <PurchasingDashboard setPage={setPage} />}
{page==='import' && <ImportPage />}
{page==='forecast' && <ForecastPage rows={forecastRows} setRows={setForecastRows} />}
{page==='bom' && <BOMPage />}
{page==='requirements' && <RequirementsPage />}
{page==='suppliers' && <SuppliersPage />}
{page === "purchase-orders" && <PurchaseOrdersPage />}
      </main>
    </div>
  )
}

export default App
