import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#f8f6f6]">
      <Sidebar />
      <main className="flex-1 ml-[240px] flex flex-col">
        <Header />
        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout