import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, ChevronRight } from 'lucide-react'
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
  { key: 1,     label: 'Черновики' },
  { key: 2,     label: 'Активные' },
  { key: 3,     label: 'Завершённые' },
]

const ConstructionPollsPage = () => {
  const [tab, setTab]                     = useState<'all' | VotingStatus>('all')
  const [isCreateOpen, setIsCreateOpen]   = useState(false)
  const [selectedVotingId, setSelectedVotingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['construction-votings', tab],
    queryFn: () =>
      votingsApi.getAll({ status: tab !== 'all' ? (tab as VotingStatus) : undefined }),
  })

  const votings = data?.data ?? []

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Status tabs */}
        <div className="flex gap-0.5 bg-zinc-100 rounded-xl p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="ml-auto flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Создать опрос
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {[1,2,3].map(i => (
            <div key={i} className="px-5 py-4 border-b border-zinc-100 flex items-center gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-48 skeleton rounded" />
                <div className="h-2.5 w-72 skeleton rounded" />
              </div>
              <div className="h-5 w-16 skeleton rounded-full" />
            </div>
          ))}
        </div>
      ) : votings.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <span className="material-symbols-outlined text-4xl mb-2 block">poll</span>
          <p className="text-sm font-medium">Опросы не найдены</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Plus size={13} />
            Создать первый опрос
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <ul className="divide-y divide-zinc-100">
            {votings.map((voting) => (
              <li
                key={voting.id}
                onClick={() => setSelectedVotingId(voting.id)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${VOTING_STATUS_COLORS[voting.status]}`}>
                      {VOTING_STATUS_LABELS[voting.status]}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {formatDate(voting.startDate)} — {formatDate(voting.endDate)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 truncate">{voting.title}</p>
                  {voting.description && (
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{voting.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-zinc-400">
                  <span className="text-xs">{voting.optionsCount} вариантов</span>
                  <ChevronRight size={14} className="group-hover:text-zinc-600 transition-colors" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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
