import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from '@/components/shared/Modal'
import { votingsApi } from '@/api/votings'
import { VOTING_STATUS_LABELS, VOTING_STATUS_COLORS } from '@/types'

interface VotingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  votingId: string | null
}

const VotingDetailModal = ({ isOpen, onClose, votingId }: VotingDetailModalProps) => {
  const queryClient = useQueryClient()

  const { data: detailData, isLoading } = useQuery({
    queryKey: ['voting-detail', votingId],
    queryFn: () => votingsApi.getById(votingId!),
    enabled: !!votingId && isOpen,
  })

  const { data: resultsData } = useQuery({
    queryKey: ['voting-results', votingId],
    queryFn: () => votingsApi.getResults(votingId!),
    enabled: !!votingId && isOpen,
    retry: false,
    throwOnError: false,
  })

  const voting = detailData?.data
  const results = resultsData?.data

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['votings'] })
    queryClient.invalidateQueries({ queryKey: ['voting-detail', votingId] })
  }

  const { mutate: changeStatus, isPending: isChanging } = useMutation({
    mutationFn: (newStatus: 2 | 3) => votingsApi.changeStatus(votingId!, { newStatus }),
    onSuccess: (_, newStatus) => {
      invalidate()
      toast.success(newStatus === 2 ? 'Опрос опубликован' : 'Опрос завершён')
    },
  })

  const isDraft = voting?.status === 1
  const isActive = voting?.status === 2
  const isClosed = voting?.status === 3

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Опрос">
      {isLoading || !voting ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Заголовок + статус */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900">{voting.title}</h3>
            <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${VOTING_STATUS_COLORS[voting.status]}`}>
              {VOTING_STATUS_LABELS[voting.status]}
            </span>
          </div>

          {/* Описание */}
          <p className="text-sm text-slate-600 leading-relaxed">{voting.description}</p>

          {/* Даты */}
          <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">event</span>
              Начало: <span className="font-semibold text-slate-700">{formatDate(voting.startDate)}</span>
            </span>
            <span className="text-slate-300">—</span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">event</span>
              Конец: <span className="font-semibold text-slate-700">{formatDate(voting.endDate)}</span>
            </span>
          </div>

          {/* Варианты / Результаты */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {results && results.totalVotes > 0 ? 'Результаты' : 'Варианты ответов'}
              </p>
              {results && (
                <span className="text-xs text-slate-500">
                  Всего голосов: <span className="font-bold text-slate-700">{results.totalVotes}</span>
                </span>
              )}
            </div>

            <div className="space-y-2">
              {results && results.totalVotes > 0
                ? results.options.map((opt) => (
                    <div key={opt.optionId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 font-medium">{opt.text}</span>
                        <span className="text-slate-500 text-xs font-semibold">
                          {opt.votes} ({opt.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${opt.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                : voting.options
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((opt, i) => (
                      <div key={opt.id} className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 w-4">{i + 1}.</span>
                        <span className="text-sm text-slate-700">{opt.text}</span>
                      </div>
                    ))
              }
            </div>
          </div>

          {/* Управление статусом */}
          {!isClosed && (
            <div className="border-t border-slate-100 pt-4 space-y-2">
              {isDraft && (
                <button
                  onClick={() => changeStatus(2)}
                  disabled={isChanging}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">publish</span>
                  {isChanging ? 'Публикация...' : 'Опубликовать'}
                </button>
              )}
              {isActive && (
                <button
                  onClick={() => changeStatus(3)}
                  disabled={isChanging}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  {isChanging ? 'Завершение...' : 'Завершить опрос'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default VotingDetailModal