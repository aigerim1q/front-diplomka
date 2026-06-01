import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Settings2, Shield, Briefcase, Phone, Copy, Check } from 'lucide-react'
import { useState as useLocalState } from 'react'
import { kskContactsApi } from '@/api/kskContacts'
import { ContactDto } from '@/types'
import AddContactModal from './components/modals/AddContactModal'
import ManagePositionsModal from './components/modals/ManagePositionsModal'

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700',
]
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]


// Extract phone numbers from free-text description
const PHONE_RE = /(\+7\d{8,10})/g

const CopyPhone = ({ phone }: { phone: string }) => {
  const [copied, setCopied] = useLocalState(false)
  const clean = phone.replace(/[\s\-()]/g, '')
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(clean)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <span className="group/phone inline-flex items-center gap-1.5 text-xs text-zinc-600 font-medium mr-3 mt-0.5">
      <Phone size={11} className="text-zinc-400 shrink-0" />
      {clean}
      <button onClick={copy} title="Копировать"
        className="opacity-0 group-hover/phone:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-700">
        {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      </button>
    </span>
  )
}

const ContactDescription = ({ description }: { description: string }) => {
  const phones = [...description.matchAll(PHONE_RE)].map(m => m[0])
  const text   = description.replace(PHONE_RE, '').replace(/^[,\s]+|[,\s]+$/g, '').trim()
  return (
    <div className="mt-1">
      {phones.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {phones.map((p, i) => <CopyPhone key={i} phone={p} />)}
        </div>
      )}
      {text && <p className="text-xs text-zinc-500 mt-1">{text}</p>}
    </div>
  )
}

const ContactsPage = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen]         = useState(false)
  const [editContact, setEditContact]     = useState<ContactDto | null>(null)
  const [isPositionsOpen, setIsPositionsOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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
  const groups    = groupsData?.data ?? []
  const totalContacts = groups.reduce((s, g) => s + g.contacts.length, 0)

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setIsPositionsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
          <Settings2 size={14} />
          {t('pages.contacts.positions')}
        </button>
        <span className="text-xs text-zinc-400">
          <span className="font-semibold text-zinc-700">{positions.length}</span> {t('pages.contacts.positionsCount')}
          <span className="mx-1.5">·</span>
          <span className="font-semibold text-zinc-700">{totalContacts}</span> {t('pages.contacts.count')}
        </span>
        <button onClick={() => setIsAddOpen(true)}
          className="ml-auto flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} />{t('pages.contacts.addBtn')}
        </button>
      </div>

      {/* Groups */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-32 skeleton rounded-xl" />)}
        </div>
      ) : groups.length === 0 || groups.every(g => g.contacts.length === 0) ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">contacts</span>
          <p className="text-sm">{t("pages.contacts.notFound")}</p>
          <p className="text-xs mt-1">{t("pages.contacts.addBtn")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.filter(g => g.contacts.length > 0).map(group => (
            <div key={group.position.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2.5">
                <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                  group.position.isDefault ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {group.position.isDefault
                    ? <Shield size={14} />
                    : <Briefcase size={14} />
                  }
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">{group.position.name}</h3>
                {group.position.isDefault && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 font-medium border border-blue-100">
                    {t('pages.contacts.systemTag')}
                  </span>
                )}
                <span className="ml-auto text-xs text-zinc-400">
                  {group.contacts.length} {group.contacts.length === 1 ? t('pages.contacts.count') : t('pages.contacts.count')}
                </span>
              </div>

              {/* Contacts */}
              <ul className="divide-y divide-zinc-100">
                {group.contacts.map(contact => (
                  <li key={contact.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-zinc-50 transition-colors group">
                    {/* Avatar */}
                    <div className={`size-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${avatarColor(contact.name)}`}>
                      {contact.name[0]?.toUpperCase() ?? '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{contact.name}</p>
                      {contact.description && (
                        <ContactDescription description={contact.description} />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {confirmDeleteId === contact.id ? (
                        <>
                          <button onClick={() => deleteContact(contact.id)} disabled={isDeleting}
                            className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors disabled:opacity-50">
                            Удалить
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-medium transition-colors ml-1">
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditContact(contact)} title="Редактировать"
                            className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
                            <Edit size={13} />
                          </button>
                          <button onClick={() => setConfirmDeleteId(contact.id)} title="Удалить"
                            className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <AddContactModal
        isOpen={isAddOpen || !!editContact}
        onClose={() => { setIsAddOpen(false); setEditContact(null) }}
        positions={positions}
        editContact={editContact}
      />
      <ManagePositionsModal isOpen={isPositionsOpen} onClose={() => setIsPositionsOpen(false)} positions={positions} />
    </div>
  )
}

export default ContactsPage
