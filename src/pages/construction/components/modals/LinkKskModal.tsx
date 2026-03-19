import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/shared/Modal'
import { complexesApi } from '@/api/complexes'
import { tenantsApi } from '@/api/tenants'
import { Complex } from '@/types'

const schema = z.object({
  kskTenantId: z.string().min(1, 'Выберите КСК'),
})

type LinkKskForm = z.infer<typeof schema>

interface LinkKskModalProps {
  isOpen: boolean
  onClose: () => void
  complex: Complex | null
}

const LinkKskModal = ({ isOpen, onClose, complex }: LinkKskModalProps) => {
  const queryClient = useQueryClient()

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-ksk'],
    queryFn: () => tenantsApi.getAll({ type: 2 }), // type 2 = KSK
    enabled: isOpen,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkKskForm>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, error: serverError } = useMutation({
    mutationFn: (data: LinkKskForm) => complexesApi.linkKsk(complex!.id, { kskTenantId: data.kskTenantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complexes'] })
      reset()
      onClose()
    },
  })

  const handleClose = () => { reset(); onClose() }

  const kskList = tenantsData?.data.items ?? []

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Привязать КСК">
      <div className="mb-4">
        <p className="text-sm text-slate-500">
          Комплекс: <span className="font-semibold text-slate-800">{complex?.name}</span>
        </p>
        {complex?.linkedKskTenantId && (
          <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="material-symbols-outlined text-amber-500 text-[18px]">warning</span>
            <p className="text-xs text-amber-700">Уже привязан КСК. Выбор нового перезапишет текущую привязку.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            Ошибка при привязке КСК
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Выберите КСК</label>
          <select
            {...register('kskTenantId')}
            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
              errors.kskTenantId ? 'border-red-400' : 'border-slate-200'
            }`}
          >
            <option value="">— Выберите КСК —</option>
            {kskList.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {errors.kskTenantId && <p className="mt-1 text-xs text-red-500">{errors.kskTenantId.message}</p>}
          {kskList.length === 0 && (
            <p className="mt-1 text-xs text-slate-400">Нет доступных КСК</p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors">
            Отмена
          </button>
          <button type="submit" disabled={isPending}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
            {isPending ? 'Привязка...' : 'Привязать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default LinkKskModal
