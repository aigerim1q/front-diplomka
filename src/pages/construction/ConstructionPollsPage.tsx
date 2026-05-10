import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { votingsApi } from '@/api/votings'
import {
  VotingStatus,
  VOTING_STATUS_LABELS,
  VOTING_STATUS_COLORS,
} from '@/types'
import CreateVotingModal from '@/pages/ksk/components/modals/CreateVotingModal'
import VotingDetailModal from '@/pages/ksk/components/modals/VotingDetailModal'

const TABS: { key: 'all' | VotingStatus; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 1, label: 'Черновики' },
  { key: 2, label: 'Активные' },
  { key: 3, label: 'Завершённые' },
]

const ConstructionPollsPage = () => {
  const [tab, setTab] = useState<'all' | VotingStatus>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedVotingId, setSelectedVotingId] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setIsCreateOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['votings', tab],
    queryFn: () =>
      votingsApi.getAll({
        status: tab !== 'all' ? (tab as VotingStatus) : undefined,
      }),
  })

  const votings = data?.data ?? []

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Табы */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Контент */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : votings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm text-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">poll</span>
          <p className="font-medium">Опросы не найдены</p>
          <p className="text-sm mt-1">Нажмите «Создать опрос» чтобы добавить первый</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {votings.map((voting) => (
            <div
              key={voting.id}
              onClick={() => setSelectedVotingId(voting.id)}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${VOTING_STATUS_COLORS[voting.status]}`}>
                      {VOTING_STATUS_LABELS[voting.status]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(voting.startDate)} — {formatDate(voting.endDate)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                    {voting.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{voting.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <span className="material-symbols-outlined text-[16px]">check_box</span>
                    <span>{voting.optionsCount} вариантов</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-[20px] group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалки */}
      <CreateVotingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <VotingDetailModal
        isOpen={!!selectedVotingId}
        onClose={() => setSelectedVotingId(null)}
        votingId={selectedVotingId}
      />
    </div>
  )
}

export default ConstructionPollsPage
