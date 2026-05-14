import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import Modal from '@/components/shared/Modal'
import { kskContactsApi } from '@/api/kskContacts'
import { ContactPositionDto } from '@/types'

interface ManagePositionsModalProps {
  isOpen: boolean
  onClose: () => void
  positions: ContactPositionDto[]
}

const ManagePositionsModal = ({ isOpen, onClose, positions }: ManagePositionsModalProps) => {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { mutate: createPosition, isPending: isCreating } = useMutation({
    mutationFn: () => kskContactsApi.createPosition({ name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-contact-positions'] })
      queryClient.invalidateQueries({ queryKey: ['ksk-contacts'] })
      toast.success('Должность добавлена')
      setName('')
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const code = err.response?.data?.code
        if (code === 'KSK_CONTACT_POSITION_DUPLICATE') {
          toast.error('Должность с таким именем уже существует')
          return
        }
        toast.error(err.response?.data?.message ?? 'Не удалось создать должность')
      } else {
        toast.error('Не удалось создать должность')
      }
    },
  })

  const { mutate: deletePosition, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => kskContactsApi.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-contact-positions'] })
      queryClient.invalidateQueries({ queryKey: ['ksk-contacts'] })
      toast.success('Должность удалена')
      setConfirmDeleteId(null)
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const code = err.response?.data?.code
        if (code === 'KSK_CONTACT_POSITION_IS_DEFAULT') {
          toast.error('Системную должность удалить нельзя')
          return
        }
        toast.error(err.response?.data?.message ?? 'Не удалось удалить должность')
      } else {
        toast.error('Не удалось удалить должность')
      }
    },
  })

  const handleClose = () => {
    setName('')
    setConfirmDeleteId(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Управление должностями">
      <div className="space-y-4">
        {/* Add new position */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Добавить должность</label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Электрик"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              onClick={() => createPosition()}
              disabled={!name.trim() || isCreating}
              className="px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isCreating ? '...' : 'Добавить'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Существующие должности
          </p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {positions.map((pos) => (
              <div
                key={pos.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{pos.name}</span>
                  {pos.isDefault && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                      системная
                    </span>
                  )}
                </div>
                {!pos.isDefault && (
                  confirmDeleteId === pos.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deletePosition(pos.id)}
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
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(pos.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-red-500 transition-all"
                      title="Удалить должность"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ManagePositionsModal
