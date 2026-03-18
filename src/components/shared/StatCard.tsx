interface StatCardProps {
  icon: string
  iconBg: string
  iconColor: string
  label: string
  value: string | number
  trend: string
}

const StatCard = ({ icon, iconBg, iconColor, label, value, trend }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`${iconBg} ${iconColor} p-3 rounded-lg`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className="text-emerald-500 text-sm font-bold flex items-center gap-0.5">
        {trend} <span className="material-symbols-outlined text-xs">arrow_upward</span>
      </span>
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <h3 className="text-2xl font-bold mt-1">{value}</h3>
  </div>
)

export default StatCard