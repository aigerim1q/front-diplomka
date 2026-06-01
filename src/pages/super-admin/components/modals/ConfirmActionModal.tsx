import { useTranslation } from 'react-i18next'
import { ShieldOff, ShieldCheck } from 'lucide-react'
import Modal from '@/components/shared/Modal'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  type: 'block' | 'unblock'
  userName: string
}

const ConfirmActionModal = ({ isOpen, onClose, onConfirm, isLoading, type, userName }: Props) => {
  const { t } = useTranslation()
  const isBlock = type === 'block'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isBlock ? t('users.block') : t('users.unblock')} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
            isBlock ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'
          }`}>
            {isBlock
              ? <ShieldOff size={16} className="text-red-500" />
              : <ShieldCheck size={16} className="text-emerald-500" />
            }
          </div>
          <div>
            <p className="text-sm text-zinc-700">
              {isBlock ? t('users.blockConfirm') : t('users.unblockConfirm')}{' '}
              <span className="font-semibold text-zinc-900">{userName}</span>?
            </p>
            {isBlock && (
              <p className="text-xs text-red-500 mt-1">{t('users.blockWarning')}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-sm font-medium transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 ${
              isBlock ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}>
            {isLoading ? t('common.loading') : isBlock ? t('users.block') : t('users.unblock')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmActionModal
