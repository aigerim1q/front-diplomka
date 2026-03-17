import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { User } from '@/types'
import UsersTable from './components/UsersTable'
import UsersFilters from './components/UsersFilters'
import UsersPagination from './components/UsersPagination'
import AddUserModal from './components/modals/AddUserModal'
import ConfirmActionModal from './components/modals/ConfirmActionModal'

const PAGE_SIZE = 10

const UsersPage = () => {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'block' | 'unblock'
    user: User | null
  }>({ isOpen: false, type: 'block', user: null })

  useEffect(() => {
    const handler = () => setIsAddOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, role, status],
    queryFn: () => usersApi.getAll({
      page,
      pageSize: PAGE_SIZE,
      role: role ? Number(role) as any : undefined,
      status: status ? Number(status) as any : undefined,
    }),
  })

  const { mutate: blockUser, isPending: isBlocking } = useMutation({
    mutationFn: (id: string) => usersApi.block(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmModal({ isOpen: false, type: 'block', user: null })
    },
  })

  const { mutate: unblockUser, isPending: isUnblocking } = useMutation({
    mutationFn: (id: string) => usersApi.unblock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmModal({ isOpen: false, type: 'block', user: null })
    },
  })

  const handleClearFilters = () => {
    setSearch('')
    setRole('')
    setStatus('')
    setPage(1)
  }

  const handleBlock = (user: User) =>
    setConfirmModal({ isOpen: true, type: 'block', user })

  const handleUnblock = (user: User) =>
    setConfirmModal({ isOpen: true, type: 'unblock', user })

  const handleConfirmAction = () => {
    if (!confirmModal.user) return
    if (confirmModal.type === 'block') {
      blockUser(confirmModal.user.userId)
    } else {
      unblockUser(confirmModal.user.userId)
    }
  }

  const allUsers = data?.data.items ?? []
  const users = search
    ? allUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : allUsers

  const totalCount = data?.data.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <UsersFilters
        search={search}
        role={role}
        status={status}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onRoleChange={(v) => { setRole(v); setPage(1) }}
        onStatusChange={(v) => { setStatus(v); setPage(1) }}
        onClear={handleClearFilters}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <UsersTable
            users={users}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
          />
          {totalPages > 1 && (
            <UsersPagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <AddUserModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {}}
      />

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: 'block', user: null })}
        onConfirm={handleConfirmAction}
        isLoading={isBlocking || isUnblocking}
        type={confirmModal.type}
        userName={`${confirmModal.user?.firstName ?? ''} ${confirmModal.user?.lastName ?? ''}`}
      />
    </div>
  )
}

export default UsersPage