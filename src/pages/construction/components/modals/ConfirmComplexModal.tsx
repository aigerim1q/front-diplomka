import Modal from '@/components/shared/Modal'
import { Complex } from '@/types'

interface ConfirmComplexModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  type: 'activate' | 'deactivate'
  complex: Complex | null
}

const ConfirmComplexModal = ({ isOpen, onClose, onConfirm, isLoading, type, complex }: ConfirmComplexModalProps) => {
  const isDeactivate = type === 'deactivate'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDeactivate ? 'Деактивировать комплекс' : 'Активировать комплекс'}
    >
      <p className="text-slate-600 text-sm mb-6">
        {isDeactivate
          ? 'Вы уверены, что хотите деактивировать комплекс '
          : 'Вы уверены, что хотите активировать комплекс '}
        <span className="font-semibold text-slate-900">{complex?.name}</span>?
        {isDeactivate && (
          <span className="block mt-2 text-red-500 text-xs">
            Жильцы потеряют доступ к сервисам комплекса.
          </span>
        )}
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors">
          Отмена
        </button>
        <button onClick={onConfirm} disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-60 ${
            isDeactivate ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}>
          {isLoading ? 'Загрузка...' : isDeactivate ? 'Деактивировать' : 'Активировать'}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmComplexModal
