import { User } from '@/types'
import { useRole } from '@/hooks/useRole'

const ROLE_BADGE: Record<number, string> = {
  1: 'bg-purple-100 text-purple-800',
  2: 'bg-purple-100 text-purple-800',
  3: 'bg-blue-100 text-blue-800',
  4: 'bg-amber-100 text-amber-800',
  5: 'bg-primary/10 text-primary',
}

interface UsersTableProps {
  users: User[]
  onBlock: (user: User) => void
  onUnblock: (user: User) => void
}

const UsersTable = ({ users, onBlock, onUnblock }: UsersTableProps) => {
  const { getRoleName } = useRole()

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {['Name', 'Email', 'Role', 'Status', 'Actions'].map((col) => (
              <th key={col} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${col === 'Actions' ? 'text-right' : ''}`}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => {
            const isBlocked = user.status === 2
            return (
              <tr key={user.userId} className={`hover:bg-slate-50/50 transition-colors ${isBlocked ? 'opacity-70' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {user.firstName?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                    </div>
                    <span className={`text-sm font-semibold ${isBlocked ? 'text-slate-400' : 'text-slate-900'}`}>
                    {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email.split('@')[0]}
                    </span>
                  </div>
                </td>
                <td className={`px-6 py-4 text-sm ${isBlocked ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                    {getRoleName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    <span className={`size-1.5 rounded-full ${isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
                    {isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {isBlocked ? (
                      <button
                        onClick={() => onUnblock(user)}
                        className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Unblock"
                      >
                        <span className="material-symbols-outlined text-[20px]">undo</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onBlock(user)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Block"
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

      {users.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">group</span>
          <p className="font-medium">Пользователи не найдены</p>
        </div>
      )}
    </div>
  )
}

export default UsersTable