import { Edit2, Link2, Power, PowerOff, MapPin } from 'lucide-react'
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
  const hasKsk   = !!complex.linkedKskTenantId

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg hover:border-zinc-300 transition-all duration-200 flex flex-col">

      {/* Image */}
      <div className="relative h-44 overflow-hidden shrink-0">
        {complex.imageUrl ? (
          <img
            src={complex.imageUrl}
            alt={complex.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #e4e8ed 0%, #cbd2db 100%)' }}
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#a1aab6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        )}

        {/* Top-right: active status */}
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm ${
          isActive ? 'bg-emerald-500 text-white' : 'bg-zinc-500 text-white'
        }`}>
          {isActive ? 'Активен' : 'Неактивен'}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Name + region */}
        <div>
          <h3 className="text-sm font-bold text-zinc-900 truncate leading-snug">{complex.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-zinc-400 text-xs">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{complex.address}, {complex.city}</span>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md">
            {complex.region}
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${
            hasKsk
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-zinc-50 text-zinc-400 border-zinc-100'
          }`}>
            {hasKsk ? 'КСК привязан' : 'Без КСК'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-100" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(complex)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            <Edit2 size={12} />
            Изменить
          </button>

          <button
            onClick={() => onLinkKsk(complex)}
            title={hasKsk ? 'Изменить КСК' : 'Привязать КСК'}
            className={`flex items-center justify-center size-[30px] rounded-lg border text-xs transition-colors ${
              hasKsk
                ? 'border-emerald-200 text-emerald-500 hover:bg-emerald-50'
                : 'border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700'
            }`}
          >
            <Link2 size={13} />
          </button>

          <div className="flex-1" />

          {isActive ? (
            <button
              onClick={() => onDeactivate(complex)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors"
            >
              <PowerOff size={12} />
              Деактивировать
            </button>
          ) : (
            <button
              onClick={() => onActivate(complex)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 text-xs font-medium hover:bg-emerald-50 transition-colors"
            >
              <Power size={12} />
              Активировать
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComplexCard
