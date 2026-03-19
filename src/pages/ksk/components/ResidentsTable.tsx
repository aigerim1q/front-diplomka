import { Resident } from '@/types'

interface ResidentsTableProps {
  residents: Resident[]
  onBlock: (resident: Resident) => void
  onUnblock: (resident: Resident) => void
  onEdit: (resident: Resident) => void
  onResetPassword: (resident: Resident) => void
}

const ResidentsTable = ({
  residents,
  onBlock,
  onUnblock,
  onEdit,
  onResetPassword,
}: ResidentsTableProps) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {['Жилец', 'Email', 'Телефон', 'Дата регистрации', 'Статус', 'Действия'].map((col) => (
              <th
                key={col}
                className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${col === 'Действия' ? 'text-right' : ''}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {residents.map((resident) => {
            const isBlocked = resident.status === 2
            const name =
              resident.fullName ||
              `${resident.firstName ?? ''} ${resident.lastName ?? ''}`.trim() ||
              resident.email.split('@')[0]

            return (
              <tr
                key={resident.id}
                className={`hover:bg-slate-50/50 transition-colors ${isBlocked ? 'opacity-70' : ''}`}
              >
                {/* Имя */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-[#065F46]/10 flex items-center justify-center text-[#065F46] font-bold text-sm flex-shrink-0">
                      {name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className={`text-sm font-semibold ${isBlocked ? 'text-slate-400' : 'text-slate-900'}`}>
                      {name}
                    </span>
                  </div>
                </td>

                {/* Email */}
                <td className={`px-6 py-4 text-sm ${isBlocked ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                  {resident.email}
                </td>

                {/* Телефон */}
                <td className="px-6 py-4 text-sm text-slate-500">
                  {resident.phoneNumber ?? '—'}
                </td>

                {/* Дата */}
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(resident.createdAt).toLocaleDateString('ru-RU')}
                </td>

                {/* Статус */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    isBlocked
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-[#065F46]/10 text-[#065F46]'
                  }`}>
                    <span className={`size-1.5 rounded-full ${isBlocked ? 'bg-slate-400' : 'bg-[#065F46]'}`} />
                    {isBlocked ? 'Заблокирован' : 'Активен'}
                  </span>
                </td>

                {/* Действия */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {/* Редактировать */}
                    <button
                      onClick={() => onEdit(resident)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#065F46] transition-colors"
                      title="Редактировать"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>

                    {/* Сброс пароля */}
                    <button
                      onClick={() => onResetPassword(resident)}
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-colors"
                      title="Сбросить пароль"
                    >
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    </button>

                    {/* Блок / Разблок */}
                    {isBlocked ? (
                      <button
                        onClick={() => onUnblock(resident)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Разблокировать"
                      >
                        <span className="material-symbols-outlined text-[20px]">undo</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onBlock(resident)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Заблокировать"
                      >
                        <span className="material-symbols-outlined text-[20px]">block</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {residents.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">group</span>
          <p className="font-medium">Жильцы не найдены</p>
        </div>
      )}
    </div>
  )
}

export default ResidentsTable