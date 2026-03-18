import { useTranslation } from 'react-i18next'
import Modal from '@/components/shared/Modal'

interface ConfirmActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  type: 'block' | 'unblock'
  userName: string
}

const ConfirmActionModal = ({
  isOpen, onClose, onConfirm, isLoading, type, userName,
}: ConfirmActionModalProps) => {
  const { t } = useTranslation()
  const isBlock = type === 'block'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isBlock ? t('users.block') : t('users.unblock')}
    >
      <p className="text-slate-600 mb-6">
        {isBlock ? t('users.blockConfirm') : t('users.unblockConfirm')}{' '}
        <span className="font-semibold">{userName}</span>?
        {isBlock && (
          <span className="block mt-2 text-sm text-red-500">
            {t('users.blockWarning')}
          </span>
        )}
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-60 ${
            isBlock ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {isLoading
            ? t('common.loading')
            : isBlock ? t('users.block') : t('users.unblock')}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmActionModal