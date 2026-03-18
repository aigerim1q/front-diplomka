const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function getColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % AVATAR_COLORS.length
}

interface ComplexAvatarProps {
  name: string
  size?: 'sm' | 'md'
}

const ComplexAvatar = ({ name, size = 'md' }: ComplexAvatarProps) => {
  const colorClass = AVATAR_COLORS[getColorIndex(name)]
  const sizeClass = size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm'

  return (
    <div className={`${sizeClass} ${colorClass} rounded-lg flex items-center justify-center font-bold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  )
}

export default ComplexAvatar