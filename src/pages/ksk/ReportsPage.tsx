import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload, Download, Trash2, FileText, FileSpreadsheet, FileImage, File, ChevronLeft, ChevronRight } from 'lucide-react'
import { reportsApi } from '@/api/reports'
import { ReportListItemDto } from '@/types'
import UploadReportModal from './components/modals/UploadReportModal'


const fmtSize = (b: number) =>
  b < 1024 ? `${b} Б` : b < 1048576 ? `${(b/1024).toFixed(1)} КБ` : `${(b/1048576).toFixed(1)} МБ`

const fileInfo = (ct: string) => {
  if (ct === 'application/pdf')
    return { icon: <FileText size={16}/>, color: 'bg-red-50 text-red-500 border-red-100', dot: 'bg-red-400', ext: 'PDF' }
  if (ct.includes('excel') || ct.includes('spreadsheet') || ct === 'text/csv')
    return { icon: <FileSpreadsheet size={16}/>, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-400', ext: 'XLS' }
  if (ct.startsWith('image/'))
    return { icon: <FileImage size={16}/>, color: 'bg-blue-50 text-blue-500 border-blue-100', dot: 'bg-blue-400', ext: 'IMG' }
  if (ct.includes('word'))
    return { icon: <FileText size={16}/>, color: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-400', ext: 'DOC' }
  return { icon: <File size={16}/>, color: 'bg-zinc-100 text-zinc-500 border-zinc-200', dot: 'bg-zinc-300', ext: 'FILE' }
}

const ReportsPage = () => {
  const queryClient = useQueryClient()
  const currentYear  = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const { t } = useTranslation()
  const _months = t('pages.reports.months', { returnObjects: true })
  const _monthsShort = t('pages.reports.monthsShort', { returnObjects: true })
  const MONTHS: string[] = Array.isArray(_months) ? _months : ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
  const MONTHS_SHORT: string[] = Array.isArray(_monthsShort) ? _monthsShort : ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
  const [selectedYear,  setSelectedYear]  = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number | 'annual' | 'all' | null>('all')
  const [isUploadOpen,  setIsUploadOpen]  = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [uploadMonth, setUploadMonth] = useState<number | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-reports', selectedYear],
    queryFn: () => reportsApi.getAll({ year: selectedYear }),
  })

  const { mutate: del, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-reports'] })
      queryClient.invalidateQueries({ queryKey: ['ksk-report-years'] })
      toast.success('Отчёт удалён')
      setConfirmDeleteId(null)
    },
    onError: () => toast.error('Не удалось удалить'),
  })

  const reports = data?.data ?? []

  // Group by month
  const byMonth: Record<number | 'annual', ReportListItemDto[]> = {} as any
  for (const r of reports) {
    const key = r.month != null ? r.month : 'annual'
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(r)
  }

  // Shown files (selected month or annual)
  const shownFiles = selectedMonth === 'all' ? reports : selectedMonth != null ? (byMonth[selectedMonth] ?? []) : []

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        {/* Year navigator */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
          <button onClick={() => setSelectedYear(y => y - 1)}
            className="size-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-sm transition-all">
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 text-sm font-semibold text-zinc-900 tabular-nums">{selectedYear}</span>
          <button onClick={() => setSelectedYear(y => Math.min(y + 1, currentYear))}
            disabled={selectedYear >= currentYear}
            className="size-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
        </div>

        <span className="text-xs text-zinc-400">
          <span className="font-semibold text-zinc-700">{reports.length}</span> отчётов
        </span>

        <button onClick={() => setIsUploadOpen(true)}
          className="ml-auto flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Upload size={14} />Загрузить отчёт
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* Month calendar grid */}
        <div className="shrink-0">
          <div className="grid grid-cols-3 gap-2 w-[320px]">
            {/* All reports tile */}
            <button
              onClick={() => setSelectedMonth('all')}
              className={`col-span-3 flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                selectedMonth === 'all'
                  ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm text-zinc-700'
              }`}
            >
              <span className="text-sm font-medium">{t("pages.reports.allDocuments")}</span>
              <span className={`text-xs font-semibold tabular-nums ${selectedMonth === 'all' ? 'text-blue-600' : 'text-zinc-500'}`}>
                {reports.length} файл{reports.length !== 1 ? 'а' : ''}
              </span>
            </button>

            {/* Annual tile */}
            <div className={`group/annual col-span-3 flex items-center gap-2 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
              selectedMonth === 'annual'
                ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm text-zinc-700'
            }`}
              onClick={() => setSelectedMonth(selectedMonth === 'annual' ? 'all' : 'annual')}
            >
              <span className="text-sm font-medium flex-1">{t("pages.reports.annual")}</span>
              <div className="relative flex items-center pl-8">
                {(byMonth['annual']?.length ?? 0) > 0 && (
                  <span className={`text-xs font-semibold tabular-nums ${selectedMonth === 'annual' ? 'text-blue-600' : 'text-zinc-500'}`}>
                    {byMonth['annual'].length} файл{byMonth['annual'].length !== 1 ? 'а' : ''}
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setUploadMonth(undefined); setIsUploadOpen(true) }}
                  title={t("pages.reports.uploadAnnual")}
                  className="opacity-0 group-hover/annual:opacity-100 transition-opacity absolute left-0 size-6 flex items-center justify-center rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900"
                >
                  <Upload size={12} />
                </button>
              </div>
            </div>

            {/* Month tiles 1-12 */}
            {Array.from({length: 12}, (_, i) => i + 1).map(m => {
              const files = byMonth[m] ?? []
              const hasFiles = files.length > 0
              const isSelected = selectedMonth === m
              const isCurrent = selectedYear === currentYear && m === currentMonth
              const isFuture  = selectedYear === currentYear && m > currentMonth

              return (
                <button key={m}
                  className={`group/tile relative flex flex-col items-start p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                      : hasFiles
                        ? 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm text-zinc-700'
                        : isFuture
                          ? 'border-zinc-100 bg-transparent text-zinc-300 cursor-default'
                          : 'border-zinc-100 bg-zinc-50/50 text-zinc-400 cursor-default'
                  }`}
                  onClick={() => {
                    if (hasFiles) {
                      setSelectedMonth(isSelected ? null : m)
                    } else if (!isFuture) {
                      setUploadMonth(m)
                      setIsUploadOpen(true)
                    }
                  }}
                >
                  {/* Month name */}
                  <span className="text-xs font-semibold">{MONTHS_SHORT[m-1]}</span>

                  {/* File count/dots OR upload hint */}
                  {hasFiles ? (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <span className={`text-[11px] font-bold tabular-nums ${isSelected ? 'text-blue-700' : 'text-zinc-600'}`}>
                        {files.length}
                      </span>
                      <div className="flex gap-0.5">
                        {[...new Set(files.map(f => fileInfo(f.contentType).dot))].slice(0,3).map((dot, i) => (
                          <span key={i} className={`size-1.5 rounded-full ${isSelected ? 'bg-blue-400' : dot}`} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 h-3" />
                  )}

                  {/* Upload icon — always on hover (not future months) */}
                  {!isFuture && (
                    <span
                      onClick={e => { e.stopPropagation(); setUploadMonth(m); setIsUploadOpen(true) }}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover/tile:opacity-100 transition-opacity size-5 flex items-center justify-center rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                    >
                      <Upload size={11} />
                    </span>
                  )}
                  {/* Current month indicator */}
                  {isCurrent && !isSelected && (
                    <span className="absolute top-1.5 left-1.5 size-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Files panel */}
        <div className="flex-1 min-w-0">
          {selectedMonth == null || (selectedMonth !== 'all' && shownFiles.length === 0 && selectedMonth == null) ? (
            <div className="bg-white rounded-xl border border-zinc-200 py-16 text-center text-zinc-400">
              {isLoading ? (
                <div className="space-y-3 px-6">
                  {[1,2,3].map(i => <div key={i} className="h-12 skeleton rounded-lg" />)}
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl mb-2 block">calendar_month</span>
                  <p className="text-sm">Выберите месяц слева</p>
                  {reports.length > 0 && (
                    <p className="text-xs mt-1">Месяцы с отчётами подсвечены</p>
                  )}
                </>
              )}
            </div>
          ) : shownFiles.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-200 py-16 text-center text-zinc-400">
              <p className="text-sm">Нет отчётов</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/60 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">
                  {selectedMonth === 'all' ? `${t('pages.reports.allDocuments')} · ${selectedYear}` : selectedMonth === 'annual' ? `${t('pages.reports.annual')} · ${selectedYear}` : `${MONTHS[(selectedMonth as number) - 1]} ${selectedYear}`}
                </h3>
                <span className="ml-auto text-xs text-zinc-400">{shownFiles.length} файл{shownFiles.length !== 1 ? 'а' : ''}</span>
              </div>

              <ul className="divide-y divide-zinc-100">
                {shownFiles.map(r => {
                  const fi = fileInfo(r.contentType)
                  return (
                    <li key={r.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-50 transition-colors group">
                      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${fi.color}`}>
                        {fi.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{r.title || r.fileName}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-medium text-[10px]">{fi.ext}</span>
                          {selectedMonth === 'all' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium text-[10px]">
                              {r.month != null ? `${MONTHS[r.month - 1]}` : 'Годовой'}
                            </span>
                          )}
                          <span>{fmtSize(r.fileSizeBytes)}</span>
                          <span>{new Date(r.createdAt).toLocaleDateString('ru-RU', {day:'numeric',month:'short'})}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={r.fileUrl} download={r.fileName} target="_blank" rel="noopener noreferrer"
                          className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
                          <Download size={13} />
                        </a>
                        {confirmDeleteId === r.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => del(r.id)} disabled={isDeleting}
                              className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium disabled:opacity-50">
                              Удалить
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-medium hover:bg-zinc-50">
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(r.id)}
                            className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <UploadReportModal isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); setUploadMonth(undefined) }} defaultYear={selectedYear} defaultMonth={uploadMonth} />
    </div>
  )
}

export default ReportsPage
