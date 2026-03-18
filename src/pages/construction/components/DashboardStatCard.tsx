interface DashboardStatCardProps {
  icon: string
  iconBg: string
  iconColor: string
  label: string
  value: string | number
  badge: string
  badgeColor: string
}

const DashboardStatCard = ({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  badge,
  badgeColor,
}: DashboardStatCardProps) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className={`${iconBg} p-3 rounded-xl`}>
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
        {badge}
      </span>
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <h3 className="text-3xl font-bold mt-1 text-slate-900">{Number(value).toLocaleString()}</h3>
  </div>
)

export default DashboardStatCard