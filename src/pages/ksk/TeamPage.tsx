import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { Plus, UserCog, Trash2, Building2 } from 'lucide-react'
import Modal from '@/components/shared/Modal'
import { kskTeamApi, TeamMember } from '@/api/kskTeam'

const inputClass = (err?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all ${err ? 'border-red-400' : 'border-zinc-200'}`

const getErr = (e: unknown, fb: string) => {
  if (axios.isAxiosError(e)) {
    const code = e.response?.data?.errorCode
    if (code === 'DUPLICATE_EMAIL') return 'Email уже используется'
    if (code === 'ADMIN_NOT_FOUND')  return 'Администратор не найден'
    return e.response?.data?.message ?? fb
  }
  return fb
}

// ─── TeamPage ─────────────────────────────────────────────────────────────────
const TeamPage = () => {
  const qc = useQueryClient()
  const [isCreateOpen, setIsCreateOpen]   = useState(false)
  const [assignMember, setAssignMember]   = useState<TeamMember | null>(null)
  const [deleteId, setDeleteId]           = useState<string | null>(null)

  const { data: membersRes, isLoading } = useQuery({
    queryKey: ['ksk-team'],
    queryFn: kskTeamApi.getMembers,
  })
  const members: TeamMember[] = membersRes?.data ?? []

  const { data: complexesRes } = useQuery({
    queryKey: ['ksk-complexes'],
    queryFn: kskTeamApi.getComplexes,
  })
  const complexes = (complexesRes?.data?.items ?? []).filter(c => c.isActive)

  const complexName = (id: string | null) => {
    if (!id) return null
    return complexes.find(c => c.id === id)?.name ?? id
  }

  const { mutate: deleteMember, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => kskTeamApi.deleteMember(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ksk-team'] })
      toast.success('Администратор удалён')
      setDeleteId(null)
    },
    onError: (e) => toast.error(getErr(e, 'Не удалось удалить')),
  })

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Команда администраторов</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{members.length} администраторов</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Добавить администратора
        </button>
      </div>

      {/* Table */}
      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-20 text-center text-zinc-400">
          <UserCog size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Нет администраторов</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Plus size={13} /> Добавить первого
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Имя</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">ЖК</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {members.map(m => {
                const name = complexName(m.residentialComplexId)
                return (
                  <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                          {m.fullName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium text-zinc-900">{m.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">{m.email}</td>
                    <td className="px-5 py-3.5">
                      {name ? (
                        <span className="inline-flex items-center gap-1.5 text-zinc-700">
                          <Building2 size={13} className="text-zinc-400" />
                          {name}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs italic">— не назначен</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setAssignMember(m)}
                          className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                          title="Сменить ЖК"
                        >
                          <UserCog size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(m.id)}
                          className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {isCreateOpen && (
        <CreateAdminModal
          complexes={complexes}
          onClose={() => setIsCreateOpen(false)}
        />
      )}
      {assignMember && (
        <AssignComplexModal
          member={assignMember}
          complexes={complexes}
          onClose={() => setAssignMember(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <p className="text-base font-semibold text-zinc-900 mb-1">Удалить администратора?</p>
            <p className="text-sm text-zinc-500 mb-5">Это действие нельзя отменить.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-sm font-medium">
                Отмена
              </button>
              <button
                onClick={() => deleteMember(deleteId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CreateAdminModal ─────────────────────────────────────────────────────────
const createSchema = z.object({
  firstName:            z.string().min(1, 'Обязательное поле'),
  lastName:             z.string().min(1, 'Обязательное поле'),
  email:                z.string().email('Некорректный email'),
  residentialComplexId: z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

const CreateAdminModal = ({
  complexes,
  onClose,
}: {
  complexes: { id: string; name: string }[]
  onClose: () => void
}) => {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: (d: CreateForm) => kskTeamApi.createMember({
      email:                d.email,
      firstName:            d.firstName,
      lastName:             d.lastName,
      residentialComplexId: d.residentialComplexId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ksk-team'] })
      toast.success('Администратор создан. Пароль отправлен на email.')
      onClose()
    },
    onError: (e) => toast.error(getErr(e, 'Не удалось создать')),
  })

  const errMsg = error ? getErr(error, 'Ошибка при создании') : null

  return (
    <Modal isOpen onClose={onClose} title="Добавить администратора" size="md">
      <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
        {errMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{errMsg}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Имя <span className="text-red-400">*</span></label>
            <input {...register('firstName')} className={inputClass(!!errors.firstName)} placeholder="Айдар" />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Фамилия <span className="text-red-400">*</span></label>
            <input {...register('lastName')} className={inputClass(!!errors.lastName)} placeholder="Нурланов" />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Email <span className="text-red-400">*</span></label>
          <input {...register('email')} type="email" className={inputClass(!!errors.email)} placeholder="admin@ksk.kz" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">
            ЖК <span className="text-zinc-400 font-normal">(необязательно, можно назначить позже)</span>
          </label>
          <select {...register('residentialComplexId')} className={inputClass()}>
            <option value="">— не назначать —</option>
            {complexes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 justify-end pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-medium text-sm">
            Отмена
          </button>
          <button type="submit" disabled={isPending}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium disabled:opacity-50">
            {isPending ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── AssignComplexModal ───────────────────────────────────────────────────────
const AssignComplexModal = ({
  member,
  complexes,
  onClose,
}: {
  member: TeamMember
  complexes: { id: string; name: string }[]
  onClose: () => void
}) => {
  const qc = useQueryClient()
  const [selected, setSelected] = useState(member.residentialComplexId ?? '')

  const { mutate, isPending } = useMutation({
    mutationFn: () => kskTeamApi.assignComplex(member.id, { residentialComplexId: selected }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ksk-team'] })
      toast.success('ЖК назначен')
      onClose()
    },
    onError: (e) => toast.error(getErr(e, 'Не удалось назначить')),
  })

  return (
    <Modal isOpen onClose={onClose} title="Сменить ЖК" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-zinc-600">
          Администратор: <span className="font-semibold text-zinc-900">{member.fullName}</span>
        </p>
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">Жилой комплекс</label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className={inputClass()}
          >
            <option value="">— не назначен —</option>
            {complexes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-medium text-sm">
            Отмена
          </button>
          <button onClick={() => mutate()} disabled={isPending || !selected}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium disabled:opacity-50">
            {isPending ? 'Сохранение...' : 'Назначить'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default TeamPage
