import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import axios from 'axios'
import Modal from '@/components/shared/Modal'
import { kskContactsApi } from '@/api/kskContacts'
import { ContactPositionDto } from '@/types'

interface Props { isOpen: boolean; onClose: () => void; positions: ContactPositionDto[] }

const ManagePositionsModal = ({ isOpen, onClose, positions }: Props) => {
  const queryClient = useQueryClient()
  const [name, setName]                   = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ksk-contact-positions'] })
    queryClient.invalidateQueries({ queryKey: ['ksk-contacts'] })
  }

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: () => kskContactsApi.createPosition({ name: name.trim() }),
    onSuccess: () => { invalidate(); toast.success('Должность добавлена'); setName('') },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.code === 'KSK_CONTACT_POSITION_DUPLICATE') {
        toast.error('Уже существует')
      } else {
        toast.error('Ошибка')
      }
    },
  })

  const { mutate: del, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => kskContactsApi.deletePosition(id),
    onSuccess: () => { invalidate(); toast.success('Удалена'); setConfirmDeleteId(null) },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.code === 'KSK_CONTACT_POSITION_IS_DEFAULT') {
        toast.error('Системную должность удалить нельзя')
      } else {
        toast.error('Ошибка')
      }
    },
  })

  const handleClose = () => { setName(''); setConfirmDeleteId(null); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Управление должностями" size="sm">
      <div className="space-y-4">
        {/* Add form */}
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1.5">Новая должность</label>
          <div className="flex gap-2">
            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (name.trim()) create() } }}
              placeholder="Электрик"
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            <button onClick={() => create()} disabled={!name.trim() || isCreating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors disabled:opacity-40">
              <Plus size={13} />
              {isCreating ? '...' : 'Добавить'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="border-t border-zinc-100 pt-4">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Существующие</p>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {positions.map(pos => (
              <div key={pos.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-50 group transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-800">{pos.name}</span>
                  {pos.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 font-medium">
                      системная
                    </span>
                  )}
                </div>
                {!pos.isDefault && (
                  confirmDeleteId === pos.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => del(pos.id)} disabled={isDeleting}
                        className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium disabled:opacity-50">
                        Удалить
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-medium hover:bg-zinc-50">
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(pos.id)}
                      className="size-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={13} />
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-100">
          <button onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium transition-colors">
            Готово
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ManagePositionsModal
