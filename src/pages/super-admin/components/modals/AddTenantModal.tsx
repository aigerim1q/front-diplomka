import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/shared/Modal'
import { tenantsApi } from '@/api/tenants'
import { TenantType } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  type: z.string().min(1, 'Выберите тип'),
  description: z.string().optional(),
})

type AddTenantForm = z.infer<typeof schema>

interface AddTenantModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputClass = (error?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
    error ? 'border-red-400' : 'border-slate-200'
  }`

const AddTenantModal = ({ isOpen, onClose }: AddTenantModalProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const types = [
    { value: 1, label: t('tenants.types.constructionCompany') },
    { value: 2, label: t('tenants.types.ksk') },
    { value: 3, label: t('tenants.types.business') },
  ]

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddTenantForm>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: tenantsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      reset()
      onClose()
    },
  })

  const onSubmit = (data: AddTenantForm) => {
    mutate({
      name: data.name,
      type: Number(data.type) as TenantType,
      description: data.description || undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('tenants.addTenant')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            {t('tenants.createError')}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">{t('tenants.name')}</label>
          <input
            {...register('name')}
            className={inputClass(!!errors.name)}
            placeholder="ЖСК Алтын"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">{t('tenants.organizationType')}</label>
          <select {...register('type')} className={inputClass(!!errors.type)}>
            <option value="">{t('tenants.selectType')}</option>
            {types.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            {t('tenants.description')} <span className="text-slate-400 font-normal">({t('tenants.descriptionOptional')})</span>
          </label>
          <textarea
            {...register('description')}
            className={inputClass(false)}
            placeholder={t('tenants.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isPending ? t('common.creating') : t('common.create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddTenantModal
