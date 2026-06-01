import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Copy, Check, AlertTriangle, KeyRound } from 'lucide-react'
import Modal from '@/components/shared/Modal'
import { kskResidentsApi } from '@/api/kskResidents'
import { Resident } from '@/types'

interface Props { isOpen: boolean; onClose: () => void; resident: Resident | null }

const ResetPasswordModal = ({ isOpen, onClose, resident }: Props) => {
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => kskResidentsApi.resetPassword(resident!.id),
    onSuccess: (res) => setNewPassword(res.data.temporaryPassword),
  })

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => { setNewPassword(null); setCopied(false); onClose() }

  const name = resident?.fullName || `${resident?.firstName ?? ''} ${resident?.lastName ?? ''}`.trim() || resident?.email || ''

  // — Экран с новым паролем —
  if (newPassword) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Пароль сброшен" size="sm">
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-700 mb-3">Временный пароль выдан</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm font-bold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-3 py-2">
                {newPassword}
              </code>
              <button
                onClick={handleCopy}
                className="size-9 flex items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} className="text-zinc-400" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <p className="text-xs">Сохраните пароль — он больше не будет показан!</p>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors"
          >
            Готово
          </button>
        </div>
      </Modal>
    )
  }

  // — Экран подтверждения —
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Сбросить пароль" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <KeyRound size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-zinc-700">
              Сбросить пароль жильца <span className="font-semibold text-zinc-900">{name}</span>?
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Жилец получит временный пароль и должен будет сменить его при входе.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
          <button onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-sm font-medium transition-colors">
            Отмена
          </button>
          <button onClick={() => mutate()} disabled={isPending}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {isPending ? 'Сброс...' : 'Сбросить пароль'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ResetPasswordModal
