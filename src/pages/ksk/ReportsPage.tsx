import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reportsApi } from '@/api/reports'
import { ReportListItemDto } from '@/types'
import UploadReportModal from './components/modals/UploadReportModal'

const MONTHS_LABELS: Record<number, string> = {
  1: 'Январь', 2: 'Февраль', 3: 'Март', 4: 'Апрель',
  5: 'Май', 6: 'Июнь', 7: 'Июль', 8: 'Август',
  9: 'Сентябрь', 10: 'Октябрь', 11: 'Ноябрь', 12: 'Декабрь',
}

const FILE_ICONS: Record<string, string> = {
  'application/pdf': 'picture_as_pdf',
  'application/msword': 'description',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'description',
  'application/vnd.ms-excel': 'table_chart',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'table_chart',
  'application/vnd.ms-powerpoint': 'slideshow',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'slideshow',
  'text/plain': 'article',
  'text/csv': 'table_chart',
  'image/jpeg': 'image',
  'image/png': 'image',
}

const FILE_COLORS: Record<string, string> = {
  'application/pdf': 'text-red-500 bg-red-50',
  'application/vnd.ms-excel': 'text-emerald-600 bg-emerald-50',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'text-emerald-600 bg-emerald-50',
  'text/csv': 'text-emerald-600 bg-emerald-50',
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

const getFileIcon = (contentType: string) => FILE_ICONS[contentType] ?? 'insert_drive_file'
const getFileColor = (contentType: string) => FILE_COLORS[contentType] ?? 'text-slate-500 bg-slate-100'

const ReportsPage = () => {
  const queryClient = useQueryClient()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setIsUploadOpen(true)
    window.addEventListener('openAddModal', handler)
    return () => window.removeEventListener('openAddModal', handler)
  }, [])

  const { data: yearsData } = useQuery({
    queryKey: ['ksk-report-years'],
    queryFn: () => reportsApi.getYears(),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['ksk-reports', selectedYear],
    queryFn: () => reportsApi.getAll({ year: selectedYear }),
  })

  const { mutate: deleteReport, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-reports'] })
      queryClient.invalidateQueries({ queryKey: ['ksk-report-years'] })
      toast.success('Документ удалён')
      setConfirmDeleteId(null)
    },
    onError: () => toast.error('Не удалось удалить документ'),
  })

  const reports = data?.data ?? []
  const years = yearsData?.data ?? []

  // Ensure current year always in dropdown
  const yearOptions = Array.from(
    new Set([currentYear, ...years]).values()
  ).sort((a, b) => b - a)

  // Group by month (null = годовой)
  const grouped = reports.reduce<Record<string, ReportListItemDto[]>>((acc, r) => {
    const key = r.month != null ? String(r.month) : 'annual'
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    if (a === 'annual') return -1
    if (b === 'annual') return 1
    return Number(b) - Number(a)
  })

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-600">Год:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <span className="text-sm text-slate-500 ml-auto">
          Документов за {selectedYear}:{' '}
          <span className="font-bold text-slate-900">{reports.length}</span>
          {reports.some((r) => r.isScheduled) && (
            <span className="ml-2 text-amber-600 font-medium">
              · {reports.filter((r) => r.isScheduled).length} запланировано
            </span>
          )}
        </span>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Загрузить документ
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">folder_open</span>
          <p className="font-medium">Документов за {selectedYear} год нет</p>
          <p className="text-xs mt-1">Нажмите «Загрузить документ», чтобы добавить первый</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map(([groupKey, items]) => (
            <div key={groupKey} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  {groupKey === 'annual' ? 'calendar_today' : 'event'}
                </span>
                <h3 className="font-bold text-slate-900">
                  {groupKey === 'annual' ? `Годовые отчёты · ${selectedYear}` : `${MONTHS_LABELS[Number(groupKey)]} ${selectedYear}`}
                </h3>
                <span className="ml-auto text-xs text-slate-500">{items.length} файл(ов)</span>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-100">
                {items.map((report) => (
                  <div key={report.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 group">
                    {/* Icon */}
                    <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getFileColor(report.contentType)}`}>
                      <span className="material-symbols-outlined text-[22px]">{getFileIcon(report.contentType)}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {report.title || report.fileName}
                        </p>
                        {report.isScheduled && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            Запланировано
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {report.title && report.title !== report.fileName && (
                          <span className="mr-2">{report.fileName}</span>
                        )}
                        {formatFileSize(report.fileSizeBytes)}
                        {report.isScheduled && (
                          <span className="ml-2">
                            · публикация {new Date(report.beginDate).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                        <span className="ml-2">
                          · загружен {new Date(report.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={report.fileUrl}
                        download={report.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                        title="Скачать"
                      >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </a>

                      {confirmDeleteId === report.id ? (
                        <>
                          <button
                            onClick={() => deleteReport(report.id)}
                            disabled={isDeleting}
                            className="px-2 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-semibold disabled:opacity-60"
                          >
                            Удалить
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(report.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Удалить"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadReportModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultYear={selectedYear}
      />
    </div>
  )
}

export default ReportsPage
