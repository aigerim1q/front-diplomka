import Modal from '@/components/shared/Modal'

interface DeleteServiceConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  serviceTitle: string
}

const DeleteServiceConfirmModal = ({
  isOpen, onClose, onConfirm, isLoading, serviceTitle,
}: DeleteServiceConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Удалить сервис">
      <p className="text-slate-600 mb-6 text-sm">
        Вы уверены, что хотите удалить сервис{' '}
        <span className="font-semibold text-slate-900">«{serviceTitle}»</span>?
        <span className="block mt-2 text-red-500 text-xs">
          Это действие нельзя отменить. Карточка и обложка будут удалены безвозвратно.
        </span>
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors disabled:opacity-60"
        >
          {isLoading ? 'Удаление...' : 'Удалить'}
        </button>
      </div>
    </Modal>
  )
}

export default DeleteServiceConfirmModal
