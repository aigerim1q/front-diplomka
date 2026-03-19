import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Modal from '@/components/shared/Modal'
import { kskResidentsApi } from '@/api/kskResidents'
import { Resident } from '@/types'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  resident: Resident | null
}

const ResetPasswordModal = ({ isOpen, onClose, resident }: ResetPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => kskResidentsApi.resetPassword(resident!.id),
    onSuccess: (res) => {
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

  const name =
    resident?.fullName ||
    `${resident?.firstName ?? ''} ${resident?.lastName ?? ''}`.trim() ||
    resident?.email || ''

  // Экран с новым паролем
  if (newPassword) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Пароль сброшен">
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              <span className="font-semibold text-sm">Временный пароль выдан</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Новый временный пароль</p>
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
          </div>
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            Сохраните пароль — он больше не будет показан!
          </p>
          <button
            onClick={handleClose}
            className="w-full py-2 rounded-lg bg-[#065F46] text-white font-semibold text-sm hover:bg-[#065F46]/90 transition-colors"
          >
            Готово
          </button>
        </div>
      </Modal>
    )
  }

  // Экран подтверждения
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Сбросить пароль">
      <div className="space-y-4">
        <p className="text-slate-600 text-sm">
          Вы уверены, что хотите сбросить пароль жильца{' '}
          <span className="font-semibold text-slate-900">{name}</span>?
          <span className="block mt-2 text-amber-600">
            Жилец получит новый временный пароль и должен будет сменить его при входе.
          </span>
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors disabled:opacity-60"
          >
            {isPending ? 'Сброс...' : 'Сбросить пароль'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ResetPasswordModal