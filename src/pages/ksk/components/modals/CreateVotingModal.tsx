import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from '@/components/shared/Modal'
import { votingsApi } from '@/api/votings'

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле').max(200, 'Максимум 200 символов'),
  description: z.string().min(1, 'Обязательное поле').max(2000, 'Максимум 2000 символов'),
  startDate: z.string().min(1, 'Обязательное поле'),
  endDate: z.string().min(1, 'Обязательное поле'),
  showResultsAfterVote: z.boolean(),
}).refine((d) => new Date(d.endDate) > new Date(d.startDate), {
  message: 'Дата окончания должна быть позже даты начала',
  path: ['endDate'],
})

type CreateVotingForm = z.infer<typeof schema>

interface CreateVotingModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all ${
    error ? 'border-red-400' : 'border-zinc-200'
  }`

const CreateVotingModal = ({ isOpen, onClose }: CreateVotingModalProps) => {
  const queryClient = useQueryClient()
  const [options, setOptions] = useState<string[]>(['', ''])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateVotingForm>({
    resolver: zodResolver(schema),
    defaultValues: { showResultsAfterVote: true },
  })

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: votingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votings'] })
      toast.success('Опрос создан')
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    setOptions(['', ''])
    onClose()
  }

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ''])
  }

  const removeOption = (i: number) => {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i))
  }

  const updateOption = (i: number, value: string) => {
    setOptions(options.map((o, idx) => (idx === i ? value : o)))
  }

  const onSubmit = (data: CreateVotingForm) => {
    const filledOptions = options.map((o) => o.trim()).filter(Boolean)
    if (filledOptions.length < 2) {
      toast.error('Нужно минимум 2 варианта ответа')
      return
    }
    mutate({
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      showResultsAfterVote: data.showResultsAfterVote,
      options: filledOptions,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Создать опрос" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            Ошибка при создании опроса
          </div>
        )}

        {/* Заголовок */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Заголовок</label>
          <input
            {...register('title')}
            className={inputClass(!!errors.title)}
            placeholder="Нужен ли ремонт лифта?"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Описание */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Описание</label>
          <textarea
            {...register('description')}
            rows={3}
            className={inputClass(!!errors.description) + ' resize-none'}
            placeholder="Опишите суть вопроса..."
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* Даты */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Начало</label>
            <input
              {...register('startDate')}
              type="datetime-local"
              className={inputClass(!!errors.startDate)}
            />
            {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Окончание</label>
            <input
              {...register('endDate')}
              type="datetime-local"
              className={inputClass(!!errors.endDate)}
            />
            {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate.message}</p>}
          </div>
        </div>

        {/* Показывать результаты */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            {...register('showResultsAfterVote')}
            type="checkbox"
            className="size-4 rounded border-slate-300 accent-zinc-900"
          />
          <span className="text-sm text-zinc-700">Показывать результаты после голосования</span>
        </label>

        {/* Варианты ответов */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Варианты ответов
            </p>
            <span className="text-xs text-zinc-400">{options.length}/10</span>
          </div>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 w-5 text-right shrink-0">{i + 1}.</span>
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className={inputClass()}
                  placeholder={`Вариант ${i + 1}`}
                  maxLength={500}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-3 flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Добавить вариант
            </button>
          )}
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
            {isPending ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateVotingModal
