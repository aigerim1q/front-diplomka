import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Wrench, Calendar, User, Phone, CheckCheck, Ban, UserRoundCog } from 'lucide-react'
import { kskServiceRequestsApi } from '@/api/kskServiceRequests'
import { kskWorkersApi } from '@/api/kskWorkers'
import {
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_CATEGORY_LABELS,
} from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  requestId: string | null
}

const STATUS_STYLES: Record<number, string> = {
  1: 'bg-blue-50 text-blue-600 border border-blue-100',
  2: 'bg-amber-50 text-amber-600 border border-amber-100',
  3: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  4: 'bg-zinc-100 text-zinc-400 border border-zinc-200',
}

const ServiceRequestDetailModal = ({ isOpen, onClose, requestId }: Props) => {
  const queryClient = useQueryClient()
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)

  const { data: requestData, isLoading } = useQuery({
    queryKey: ['ksk-service-request', requestId],
    queryFn: () => kskServiceRequestsApi.getById(requestId!),
    enabled: !!requestId && isOpen,
  })

  const { data: workersData } = useQuery({
    queryKey: ['ksk-workers-active'],
    queryFn: () => kskWorkersApi.getAll(),
    enabled: isOpen,
    select: (res) => res.data.filter((w) => w.isActive),
  })

  const request = requestData?.data
  const workers = workersData ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ksk-service-requests'] })
    queryClient.invalidateQueries({ queryKey: ['ksk-service-request', requestId] })
  }

  const { mutate: accept, isPending: isAccepting } = useMutation({
    mutationFn: () => kskServiceRequestsApi.accept(requestId!),
    onSuccess: () => { invalidate(); toast.success('Заявка принята в работу'); queryClient.refetchQueries({ queryKey: ['ksk-service-request', requestId] }) },
  })

  const { mutate: assign, isPending: isAssigning } = useMutation({
    mutationFn: () => kskServiceRequestsApi.assign(requestId!, { workerId: selectedWorkerId }),
    onSuccess: () => { invalidate(); toast.success('Работник назначен'); setSelectedWorkerId(''); queryClient.refetchQueries({ queryKey: ['ksk-service-request', requestId] }) },
  })

  const { mutate: complete, isPending: isCompleting } = useMutation({
    mutationFn: () => kskServiceRequestsApi.complete(requestId!),
    onSuccess: () => { invalidate(); toast.success('Заявка завершена'); onClose() },
  })

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: () => kskServiceRequestsApi.cancel(requestId!, { reason: cancelReason || undefined }),
    onSuccess: () => { invalidate(); toast.success('Заявка отменена'); setShowCancelForm(false); setCancelReason(''); onClose() },
  })

  const handleClose = () => {
    setSelectedWorkerId(''); setCancelReason(''); setShowCancelForm(false); onClose()
  }

  const isNew = request?.status === 1
  const isInProgress = request?.status === 2
  const isFinal = request?.status === 3 || request?.status === 4

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Детали заявки</h2>
          <button
            onClick={handleClose}
            className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {isLoading || !request ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 skeleton rounded-lg" />)}
          </div>
        ) : (
          <div className="p-6 space-y-5">

            {/* Заголовок + статус */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-zinc-900 leading-snug">{request.title}</h3>
              <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[request.status]}`}>
                {SERVICE_REQUEST_STATUS_LABELS[request.status]}
              </span>
            </div>

            {/* Мета-строка */}
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Wrench size={12} className="text-zinc-400" />
                {SERVICE_REQUEST_CATEGORY_LABELS[request.category] ?? request.categoryName}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-zinc-400" />
                {new Date(request.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Описание */}
            {request.description && (
              <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Описание</p>
                <p className="text-sm text-zinc-700 leading-relaxed">{request.description}</p>
              </div>
            )}

            {/* Назначенный работник */}
            {request.assignedWorker && (
              <div className="rounded-xl border border-zinc-200 px-4 py-3">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">Назначенный работник</p>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-semibold text-sm shrink-0">
                    {request.assignedWorker.fullName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
                      <User size={11} className="text-zinc-400" />
                      {request.assignedWorker.fullName}
                    </p>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <Phone size={10} className="text-zinc-300" />
                      {request.assignedWorker.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Причина отмены */}
            {request.status === 4 && request.cancelReason && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Причина отмены</p>
                <p className="text-sm text-red-600">{request.cancelReason}</p>
              </div>
            )}

            {/* Действия */}
            {!isFinal && (
              <div className="border-t border-zinc-100 pt-4 space-y-2.5">

                {/* Принять */}
                {isNew && (
                  <button
                    onClick={() => accept()}
                    disabled={isAccepting}
                    className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCheck size={15} />
                    {isAccepting ? 'Принятие...' : 'Принять в работу'}
                  </button>
                )}

                {/* Назначить / переназначить работника */}
                {isInProgress && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
                      <UserRoundCog size={12} className="text-zinc-400" />
                      {request.assignedWorker ? 'Переназначить работника' : 'Назначить работника'}
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={selectedWorkerId}
                        onChange={(e) => setSelectedWorkerId(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      >
                        <option value="">— Выберите работника —</option>
                        {workers.map((w) => (
                          <option key={w.id} value={w.id}>{w.fullName} ({w.specializationName})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => assign()}
                        disabled={!selectedWorkerId || isAssigning}
                        className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors disabled:opacity-40"
                      >
                        {isAssigning ? '...' : 'Назначить'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Завершить */}
                {isInProgress && (
                  <button
                    onClick={() => complete()}
                    disabled={isCompleting}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCheck size={15} />
                    {isCompleting ? 'Завершение...' : 'Завершить заявку'}
                  </button>
                )}

                {/* Отменить */}
                {!showCancelForm ? (
                  <button
                    onClick={() => setShowCancelForm(true)}
                    className="w-full py-2.5 rounded-xl border border-zinc-200 text-zinc-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Ban size={14} />
                    Отменить заявку
                  </button>
                ) : (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-2.5">
                    <p className="text-xs text-zinc-500 font-medium">Причина отмены <span className="text-zinc-400">(необязательно)</span></p>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={2}
                      placeholder="Укажите причину..."
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowCancelForm(false); setCancelReason('') }}
                        className="flex-1 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors"
                      >
                        Назад
                      </button>
                      <button
                        onClick={() => cancel()}
                        disabled={isCancelling}
                        className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isCancelling ? 'Отмена...' : 'Подтвердить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceRequestDetailModal
