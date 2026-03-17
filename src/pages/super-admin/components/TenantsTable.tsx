import { Tenant } from '@/types'

const TYPE_BADGE: Record<string, { label: string; class: string }> = {
  1: { label: 'Строительная компания', class: 'bg-purple-100 text-purple-800' },
  2: { label: 'КСК', class: 'bg-blue-100 text-blue-800' },
  3: { label: 'Бизнес', class: 'bg-amber-100 text-amber-800' },
  'ConstructionCompany': { label: 'Строительная компания', class: 'bg-purple-100 text-purple-800' },
  'KSK': { label: 'КСК', class: 'bg-blue-100 text-blue-800' },
  'Business': { label: 'Бизнес', class: 'bg-amber-100 text-amber-800' },
}

const TYPE_ICON: Record<string, string> = {
  1: 'construction',
  2: 'location_city',
  3: 'storefront',
  'ConstructionCompany': 'construction',
  'KSK': 'location_city',
  'Business': 'storefront',
}

interface TenantsTableProps {
  tenants: Tenant[]
}

const TenantsTable = ({ tenants }: TenantsTableProps) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          {['Название', 'Тип', 'Описание', 'Статус', 'Дата создания'].map((col) => (
            <th key={col} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {tenants.map((tenant) => {
          const badge = TYPE_BADGE[tenant.type] ?? { label: String(tenant.type), class: 'bg-slate-100 text-slate-800' }
          const icon = TYPE_ICON[tenant.type] ?? 'domain'
          return (
            <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{tenant.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
                  {badge.label}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                {tenant.description ?? '—'}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <span className={`size-1.5 rounded-full ${tenant.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  {tenant.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                {new Date(tenant.createdAt).toLocaleDateString('ru-RU')}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>

    {tenants.length === 0 && (
      <div className="text-center py-16 text-slate-400">
        <span className="material-symbols-outlined text-5xl mb-3 block">domain</span>
        <p className="font-medium">Организации не найдены</p>
      </div>
    )}
  </div>
)

export default TenantsTable