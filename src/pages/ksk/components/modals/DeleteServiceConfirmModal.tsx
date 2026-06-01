import { Trash2 } from 'lucide-react'
import Modal from '@/components/shared/Modal'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  serviceTitle: string
}

const DeleteServiceConfirmModal = ({ isOpen, onClose, onConfirm, isLoading, serviceTitle }: Props) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Удалить сервис" size="sm">
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
          <Trash2 size={16} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm text-zinc-700">
            Удалить сервис <span className="font-semibold text-zinc-900">«{serviceTitle}»</span>?
          </p>
          <p className="text-xs text-red-500 mt-1">Карточка и обложка будут удалены безвозвратно.</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
        <button onClick={onClose}
          className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-sm font-medium transition-colors">
          Отмена
        </button>
        <button onClick={onConfirm} disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
          {isLoading ? 'Удаление...' : 'Удалить'}
        </button>
      </div>
    </div>
  </Modal>
)

export default DeleteServiceConfirmModal
