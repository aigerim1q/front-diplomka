import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import Modal from '@/components/shared/Modal'
import { reportsApi } from '@/api/reports'

const MONTHS = [
  { value: 1, label: 'Январь' },
  { value: 2, label: 'Февраль' },
  { value: 3, label: 'Март' },
  { value: 4, label: 'Апрель' },
  { value: 5, label: 'Май' },
  { value: 6, label: 'Июнь' },
  { value: 7, label: 'Июль' },
  { value: 8, label: 'Август' },
  { value: 9, label: 'Сентябрь' },
  { value: 10, label: 'Октябрь' },
  { value: 11, label: 'Ноябрь' },
  { value: 12, label: 'Декабрь' },
]

const ACCEPTED_EXTENSIONS = 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png'
const ACCEPTED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
]
const MAX_SIZE = 25 * 1024 * 1024

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all ${
    error ? 'border-red-400' : 'border-zinc-200'
  }`

interface Props {
  isOpen: boolean
  onClose: () => void
  defaultYear?: number
  defaultMonth?: number
}

const UploadReportModal = ({ isOpen, onClose, defaultYear, defaultMonth }: Props) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentYear = new Date().getFullYear()

  const [year, setYear] = useState(defaultYear ?? currentYear)
  const [month, setMonth] = useState<number | ''>(defaultMonth ?? '')
  const [title, setTitle] = useState('')
  const [beginDate, setBeginDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: reportsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ksk-reports'] })
      queryClient.invalidateQueries({ queryKey: ['ksk-report-years'] })
      toast.success('Отчёт загружен')
      handleClose()
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message ?? 'Ошибка при загрузке')
      } else {
        toast.error('Ошибка при загрузке')
      }
    },
  })

  const handleFileSelect = (f: File | undefined) => {
    if (!f) return
    if (!ACCEPTED_MIME.includes(f.type)) {
      setFileError(`Недопустимый формат. Допустимы: ${ACCEPTED_EXTENSIONS}`)
      return
    }
    if (f.size > MAX_SIZE) {
      setFileError('Файл больше 25 МБ')
      return
    }
    setFileError(null)
    setFile(f)
  }

  const handleClose = () => {
    setYear(defaultYear ?? currentYear)
    setMonth('')
    setTitle('')
    setBeginDate('')
    setFile(null)
    setFileError(null)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setFileError('Выберите файл')
      return
    }
    mutate({
      year,
      month: month !== '' ? month : undefined,
      title: title.trim() || undefined,
      beginDate: beginDate ? new Date(beginDate).toISOString() : undefined,
      file,
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  }

  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Загрузить отчёт">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Year + Month */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Год *</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={inputClass()}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              Месяц <span className="text-zinc-400 font-normal">необязательно</span>
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass()}
            >
              <option value="">Весь год</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">
            Заголовок <span className="text-zinc-400 font-normal">необязательно</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className={inputClass()}
            placeholder="Финансовый отчёт за май 2026"
          />
        </div>

        {/* BeginDate */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">
            Дата публикации <span className="text-zinc-400 font-normal">необязательно — без даты публикуется сразу</span>
          </label>
          <input
            type="datetime-local"
            value={beginDate}
            onChange={(e) => setBeginDate(e.target.value)}
            className={inputClass()}
          />
        </div>

        {/* File */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Файл *</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]) }}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-colors ${
              fileError ? 'border-red-400 bg-red-50' : 'border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {file ? (
              <>
                <span className="material-symbols-outlined text-4xl text-zinc-600">description</span>
                <p className="text-sm font-semibold text-zinc-800 text-center break-all">{file.name}</p>
                <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-xs text-red-500 hover:underline mt-1"
                >
                  Удалить
                </button>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl text-zinc-400">cloud_upload</span>
                <p className="text-sm font-medium text-zinc-600">Нажмите или перетащите файл</p>
                <p className="text-xs text-zinc-400">pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, jpg, png — до 25 МБ</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={`.${ACCEPTED_EXTENSIONS.split(',').join(',.')}`}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              className="hidden"
            />
          </div>
          {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-medium text-sm transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default UploadReportModal
