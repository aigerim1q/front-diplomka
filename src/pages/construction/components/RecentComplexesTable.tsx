import { useNavigate } from 'react-router-dom'
import { Complex } from '@/types'
import ComplexAvatar from './ComplexAvatar'
import ComplexStatusBadge from './ComplexStatusBadge'

interface RecentComplexesTableProps {
  complexes: Complex[]
  totalCount: number
  onNewComplex: () => void
}

const RecentComplexesTable = ({ complexes, totalCount, onNewComplex }: RecentComplexesTableProps) => {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Мои жилые комплексы</h2>
          <p className="text-sm text-slate-500 mt-0.5">Управляйте и мониторьте ваши объекты</p>
        </div>
        <button
          onClick={onNewComplex}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Новый ЖК
        </button>
      </div>

      {/* Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {['Название ЖК', 'Адрес', 'Город', 'КСК', 'Статус', 'Действия'].map((col) => (
              <th
                key={col}
                className={`px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider ${col === 'Действия' ? 'text-right' : ''}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {complexes.map((complex) => (
            <tr key={complex.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <ComplexAvatar name={complex.name} />
                  <span className="text-sm font-semibold text-slate-900">{complex.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{complex.address}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{complex.city}</td>
              <td className="px-6 py-4">
                {complex.linkedKskTenantId ? (
                  <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                    Привязан
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">Не привязан</span>
                )}
              </td>
              <td className="px-6 py-4">
                <ComplexStatusBadge isActive={complex.isActive} />
              </td>
              <td className="px-6 py-4 text-right">
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {complexes.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">domain</span>
          <p className="font-medium">Жилые комплексы не найдены</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Показано {complexes.length} из {totalCount} ЖК
        </p>
        <button
          onClick={() => navigate('/complexes')}
          className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          Все комплексы
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}

export default RecentComplexesTable