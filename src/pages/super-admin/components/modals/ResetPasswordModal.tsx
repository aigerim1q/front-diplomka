import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/shared/Modal'
import { usersApi } from '@/api/users'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
}

const ResetPasswordModal = ({ isOpen, onClose, userId, userName }: ResetPasswordModalProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => usersApi.resetPassword(userId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setNewPassword(res.data.temporaryPassword)
    },
  })

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setNewPassword(null)
    setCopied(false)
    onClose()
  }

  if (newPassword) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Пароль сброшен!">
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              <span className="font-semibold text-sm">Новый временный пароль</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1">
                {newPassword}
              </p>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-500">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            Сохраните пароль — он больше не будет показан!
          </p>
          <button
            onClick={handleClose}
            className="w-full py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            {t('users.done')}
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Сбросить пароль">
      <p className="text-slate-600 mb-6">
        Вы уверены, что хотите сбросить пароль пользователя{' '}
        <span className="font-semibold">{userName}</span>?
        <span className="block mt-2 text-sm text-red-500">
          Все активные сессии пользователя будут завершены.
        </span>
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors disabled:opacity-60"
        >
          {isPending ? t('common.loading') : 'Сбросить пароль'}
        </button>
      </div>
    </Modal>
  )
}

export default ResetPasswordModal