import { Complex } from '@/types'

interface ComplexCardProps {
  complex: Complex
  onEdit: (complex: Complex) => void
  onLinkKsk: (complex: Complex) => void
  onActivate: (complex: Complex) => void
  onDeactivate: (complex: Complex) => void
}

const ComplexCard = ({ complex, onEdit, onLinkKsk, onActivate, onDeactivate }: ComplexCardProps) => {
  const isActive = complex.isActive
  const hasKsk = !!complex.linkedKskTenantId

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group">
      {/* Превью изображения */}
      <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {/* Статус бейдж */}
        <div className={`absolute top-3 right-3 text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
          isActive ? 'bg-emerald-500' : 'bg-slate-400'
        }`}>
          {isActive ? 'Активен' : 'Неактивен'}
        </div>
        {/* Иконка ЖК */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-slate-400/50">apartment</span>
        </div>
      </div>

      <div className="p-5">
        {/* Название */}
        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">
          {complex.name}
        </h3>

        {/* Адрес */}
        <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
          <span className="material-symbols-outlined text-sm">location_on</span>
          <span className="truncate">{complex.address}, {complex.city}</span>
        </div>

        {/* Регион + КСК статус */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Регион</p>
            <p className="text-sm font-bold text-primary truncate">{complex.region}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">КСК</p>
            <p className={`text-sm font-bold ${hasKsk ? 'text-emerald-600' : 'text-slate-400'}`}>
              {hasKsk ? 'Привязан' : 'Не привязан'}
            </p>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2">
          {/* Редактировать */}
          <button
            onClick={() => onEdit(complex)}
            className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Изменить
          </button>

          {/* Привязать КСК */}
          <button
            onClick={() => onLinkKsk(complex)}
            className="flex items-center justify-center gap-1.5 border border-primary/30 text-primary py-2 px-3 rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors"
            title="Привязать КСК"
          >
            <span className="material-symbols-outlined text-sm">link</span>
          </button>

          {/* Активировать / Деактивировать */}
          {isActive ? (
            <button
              onClick={() => onDeactivate(complex)}
              className="flex-1 flex items-center justify-center gap-1.5 border border-red-100 text-red-600 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">block</span>
              Деактивировать
            </button>
          ) : (
            <button
              onClick={() => onActivate(complex)}
              className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-100 text-emerald-600 py-2 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Активировать
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComplexCard
