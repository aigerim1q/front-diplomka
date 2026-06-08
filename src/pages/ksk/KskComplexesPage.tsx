import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Building2, MapPin } from 'lucide-react'
import { kskTeamApi } from '@/api/kskTeam'

const KskComplexesPage = () => {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['ksk-linked-complexes'],
    queryFn: kskTeamApi.getLinkedComplexes,
  })

  const complexes = data?.data ?? []

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">{t('complexes.title')}</h2>
        <p className="text-sm text-zinc-500 mt-0.5">{complexes.length} {t('complexes.linkedCount')}</p>
      </div>

      {complexes.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">{t('complexes.noLinked')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t('complexes.name')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t('complexes.address')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t('complexes.city')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {complexes.map(c => (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                        <Building2 size={15} className="text-zinc-500" />
                      </div>
                      <span className="font-medium text-zinc-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-zinc-400 shrink-0" />
                      {c.address}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">{c.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default KskComplexesPage
