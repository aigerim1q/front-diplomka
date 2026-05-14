import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { kskContactsApi } from '@/api/kskContacts'
import { ContactDto } from '@/types'
import AddContactModal from './components/modals/AddContactModal'
import ManagePositionsModal from './components/modals/ManagePositionsModal'

const ContactsPage = () => {
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editContact, setEditContact] = useState<ContactDto | null>(null)
  const [isPositionsOpen, setIsPositionsOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setIsAddOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  const { data: positionsData } = useQuery({
    queryKey: ['ksk-contact-positions'],
    queryFn: () => kskContactsApi.getPositions(),
  })

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['ksk-contacts'],
    queryFn: () => kskContactsApi.getContacts(),
  })

  const { mutate: deleteContact, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => kskContactsApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-contacts'] })
      toast.success('Контакт удалён')
      setConfirmDeleteId(null)
    },
    onError: () => toast.error('Не удалось удалить контакт'),
  })

  const positions = positionsData?.data ?? []
  const groups = groupsData?.data ?? []

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex gap-3 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setIsPositionsOpen(true)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">work</span>
          Должности
        </button>
        <span className="ml-auto text-sm text-slate-500">
          Должностей: <span className="font-bold text-slate-900">{positions.length}</span>
          {' · '}
          Контактов: <span className="font-bold text-slate-900">
            {groups.reduce((sum, g) => sum + g.contacts.length, 0)}
          </span>
        </span>
      </div>

      {/* Groups */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : groups.length === 0 || groups.every((g) => g.contacts.length === 0) ? (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">contacts</span>
          <p className="font-medium">Контакты пока не добавлены</p>
          <p className="text-xs mt-1">Нажмите «+ Добавить контакт» в шапке, чтобы создать первый</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups
            .filter((g) => g.contacts.length > 0)
            .map((group) => (
              <div key={group.position.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {group.position.isDefault ? 'verified' : 'work'}
                  </span>
                  <h3 className="font-bold text-slate-900">{group.position.name}</h3>
                  {group.position.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                      системная
                    </span>
                  )}
                  <span className="ml-auto text-xs text-slate-500">
                    {group.contacts.length} {group.contacts.length === 1 ? 'контакт' : 'контактов'}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.contacts.map((contact) => (
                    <div key={contact.id} className="px-5 py-4 flex items-start gap-3 hover:bg-slate-50/50 group">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {contact.name[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
                        <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap break-words">
                          {contact.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {confirmDeleteId === contact.id ? (
                          <>
                            <button
                              onClick={() => deleteContact(contact.id)}
                              disabled={isDeleting}
                              className="px-2 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-semibold disabled:opacity-60"
                            >
                              Удалить
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                            >
                              Отмена
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditContact(contact)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                              title="Редактировать"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(contact.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                              title="Удалить"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modals */}
      <AddContactModal
        isOpen={isAddOpen || !!editContact}
        onClose={() => {
          setIsAddOpen(false)
          setEditContact(null)
        }}
        positions={positions}
        editContact={editContact}
      />

      <ManagePositionsModal
        isOpen={isPositionsOpen}
        onClose={() => setIsPositionsOpen(false)}
        positions={positions}
      />
    </div>
  )
}

export default ContactsPage
