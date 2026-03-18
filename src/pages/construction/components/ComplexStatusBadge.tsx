interface ComplexStatusBadgeProps {
  isActive: boolean
}

const ComplexStatusBadge = ({ isActive }: ComplexStatusBadgeProps) => {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <span className="size-1.5 rounded-full bg-green-500" />
        Активен
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <span className="size-1.5 rounded-full bg-red-500" />
      Неактивен
    </span>
  )
}

export default ComplexStatusBadge