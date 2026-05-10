import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from '@/components/shared/Modal'
import { kskServiceRequestsApi } from '@/api/kskServiceRequests'
import { kskWorkersApi } from '@/api/kskWorkers'
import {
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_STATUS_COLORS,
  SERVICE_REQUEST_CATEGORY_LABELS,
} from '@/types'

interface ServiceRequestDetailModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: string | null
}

const ServiceRequestDetailModal = ({ isOpen, onClose, requestId }: ServiceRequestDetailModalProps) => {
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
    onSuccess: () => {
      invalidate()
      toast.success('Заявка принята в работу')
      queryClient.refetchQueries({ queryKey: ['ksk-service-request', requestId] })
    },
  })

  const { mutate: assign, isPending: isAssigning } = useMutation({
    mutationFn: () => kskServiceRequestsApi.assign(requestId!, { workerId: selectedWorkerId }),
    onSuccess: () => {
      invalidate()
      toast.success('Работник назначен')
      setSelectedWorkerId('')
      queryClient.refetchQueries({ queryKey: ['ksk-service-request', requestId] })
    },
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
    setSelectedWorkerId('')
    setCancelReason('')
    setShowCancelForm(false)
    onClose()
  }

  const isNew = request?.status === 1
  const isInProgress = request?.status === 2
  const isFinal = request?.status === 3 || request?.status === 4

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Заявка">
      {isLoading || !request ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Заголовок + статус */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900">{request.title}</h3>
            <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${SERVICE_REQUEST_STATUS_COLORS[request.status]}`}>
              {SERVICE_REQUEST_STATUS_LABELS[request.status]}
            </span>
          </div>

          {/* Категория + дата */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">build</span>
              {SERVICE_REQUEST_CATEGORY_LABELS[request.category] ?? request.categoryName}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {new Date(request.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>

          {/* Описание */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Описание</p>
            <p className="text-sm text-slate-700 leading-relaxed">{request.description}</p>
          </div>

          {/* Назначенный работник */}
          {request.assignedWorker && (
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Назначенный работник</p>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {request.assignedWorker.fullName[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{request.assignedWorker.fullName}</p>
                  <p className="text-xs text-slate-500">{request.assignedWorker.phoneNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Причина отмены */}
          {request.status === 4 && request.cancelReason && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Причина отмены</p>
              <p className="text-sm text-red-700">{request.cancelReason}</p>
            </div>
          )}

          {/* Действия */}
          {!isFinal && (
            <div className="border-t border-slate-100 pt-4 space-y-3">

              {/* Принять */}
              {isNew && (
                <button
                  onClick={() => accept()}
                  disabled={isAccepting}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {isAccepting ? 'Принятие...' : 'Принять заявку'}
                </button>
              )}

              {/* Назначить работника */}
              {isInProgress && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">
                    {request.assignedWorker ? 'Переназначить работника' : 'Назначить работника'}
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">— Выберите работника —</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.fullName} ({w.specializationName})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => assign()}
                      disabled={!selectedWorkerId || isAssigning}
                      className="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
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
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  {isCompleting ? 'Завершение...' : 'Завершить заявку'}
                </button>
              )}

              {/* Отменить */}
              {!showCancelForm ? (
                <button
                  onClick={() => setShowCancelForm(true)}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  Отменить заявку
                </button>
              ) : (
                <div className="space-y-2 bg-red-50 rounded-xl p-4 border border-red-100">
                  <p className="text-xs font-semibold text-slate-500">Причина отмены (необязательно)</p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
                    placeholder="Укажите причину..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowCancelForm(false); setCancelReason('') }}
                      className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      Назад
                    </button>
                    <button
                      onClick={() => cancel()}
                      disabled={isCancelling}
                      className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
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
    </Modal>
  )
}

export default ServiceRequestDetailModal