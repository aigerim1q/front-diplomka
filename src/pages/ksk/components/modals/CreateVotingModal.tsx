import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/shared/Modal'
import { votingsApi } from '@/api/votings'
import { complexesApi } from '@/api/complexes'

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле').max(200, 'Максимум 200 символов'),
  description: z.string().min(1, 'Обязательное поле').max(2000, 'Максимум 2000 символов'),
  startDate: z.string().min(1, 'Обязательное поле'),
  endDate: z.string().min(1, 'Обязательное поле'),
  showResultsAfterVote: z.boolean(),
  targetKskTenantId: z.string().optional(),
  targetComplexId: z.string().optional(),
}).refine((d) => new Date(d.endDate) > new Date(d.startDate), {
  message: 'Дата окончания должна быть позже даты начала',
  path: ['endDate'],
})

type CreateVotingForm = z.infer<typeof schema>

interface CreateVotingModalProps {
  isOpen: boolean
  onClose: () => void
  isConstructionAdmin?: boolean
  isSeniorAdmin?: boolean
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all ${
    error ? 'border-red-400' : 'border-zinc-200'
  }`

const CreateVotingModal = ({ isOpen, onClose, isConstructionAdmin, isSeniorAdmin }: CreateVotingModalProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [options, setOptions] = useState<string[]>(['', ''])

  const { data: complexesData } = useQuery({
    queryKey: ['complexes-for-voting'],
    queryFn: () => complexesApi.getAll({ pageSize: 100 }),
    enabled: !!isConstructionAdmin || !!isSeniorAdmin,
  })

  const complexes = (complexesData?.data?.items ?? []).filter(
    (c) => c.isActive && c.linkedKskTenantId
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateVotingForm>({
    resolver: zodResolver(schema),
    defaultValues: { showResultsAfterVote: true, targetKskTenantId: '' },
  })

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: votingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votings'] })
      queryClient.invalidateQueries({ queryKey: ['construction-votings'] })
      toast.success(t('votingForm.toast.created'))
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
    if ((isConstructionAdmin || isSeniorAdmin) && !data.targetComplexId) {
      toast.error(t('votingForm.selectComplexError'))
      return
    }
    if (isConstructionAdmin && !data.targetKskTenantId) {
      toast.error(t('votingForm.selectComplexError'))
      return
    }
    const filledOptions = options.map((o) => o.trim()).filter(Boolean)
    if (filledOptions.length < 2) {
      toast.error(t('votingForm.minOptionsError'))
      return
    }
    mutate({
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      showResultsAfterVote: data.showResultsAfterVote,
      options: filledOptions,
      targetKskTenantId: data.targetKskTenantId || undefined,
      targetComplexId: data.targetComplexId || undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('votingForm.title')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            {t('votingForm.createError')}
          </div>
        )}

        {/* Выбор ЖК — для ConstructionAdmin и KskSeniorAdmin */}
        {(isConstructionAdmin || isSeniorAdmin) && (
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              {t('votingForm.complex')} <span className="text-red-400">*</span>
            </label>
            {complexes.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                {t('votingForm.noLinkedComplexes')}
              </div>
            ) : (
              <select
                {...register('targetComplexId')}
                className={inputClass(!!errors.targetComplexId)}
              >
                <option value="">{t('votingForm.selectComplex')}</option>
                {complexes.map((cx) => (
                  <option key={cx.id} value={cx.id}>
                    {cx.name} — {cx.address}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Заголовок */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">{t('votingForm.fields.title')}</label>
          <input
            {...register('title')}
            className={inputClass(!!errors.title)}
            placeholder={t('votingForm.placeholders.title')}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Описание */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">{t('votingForm.fields.description')}</label>
          <textarea
            {...register('description')}
            rows={3}
            className={inputClass(!!errors.description) + ' resize-none'}
            placeholder={t('votingForm.placeholders.description')}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* Даты */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">{t('votingForm.fields.start')}</label>
            <input
              {...register('startDate')}
              type="datetime-local"
              className={inputClass(!!errors.startDate)}
            />
            {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">{t('votingForm.fields.end')}</label>
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
          <span className="text-sm text-zinc-700">{t('votingForm.showResultsAfterVote')}</span>
        </label>

        {/* Варианты ответов */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {t('votingForm.options')}
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
                  placeholder={t('votingForm.optionPlaceholder', { number: i + 1 })}
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
              {t('votingForm.addOption')}
            </button>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-medium text-sm transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending || ((isConstructionAdmin || isSeniorAdmin) && complexes.length === 0)}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? t('common.creating') : t('common.create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateVotingModal
