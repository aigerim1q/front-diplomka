import { Building2 } from 'lucide-react'

const BrandHeader = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="size-11 rounded-2xl bg-zinc-900 flex items-center justify-center">
        <Building2 size={22} className="text-white" strokeWidth={2} />
      </div>
      <span className="text-xl font-bold text-zinc-900 tracking-tight">MyHome</span>
    </div>
  )
}

export default BrandHeader
