import { useNavigate } from 'react-router-dom'
import { User } from '@/types'
import { useRole } from '@/hooks/useRole'

interface RecentUsersTableProps {
  users: User[]
}

const ROLE_BADGE: Record<number, string> = {
  1: 'bg-purple-100 text-purple-700',
  2: 'bg-emerald-100 text-emerald-700',
  3: 'bg-primary/10 text-primary',
  4: 'bg-amber-100 text-amber-700',
  5: 'bg-primary/10 text-primary',
}

const RecentUsersTable = ({ users }: RecentUsersTableProps) => {
  const navigate = useNavigate()
  const { getRoleName } = useRole()

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-bold">Recent Users</h3>
        <button
          onClick={() => navigate('/users')}
          className="text-primary text-sm font-semibold hover:underline"
        >
          View All Users
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Date Joined'].map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {user.firstName?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[user.role]}`}>
                    {getRoleName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    user.status === 1
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status === 1 ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2 block">group</span>
            <p>Нет пользователей</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecentUsersTable