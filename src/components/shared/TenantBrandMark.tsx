'use client'

import { cn, getInitials } from '@/lib/utils'

interface TenantBrandMarkProps {
  logo?: string
  name: string
  className?: string
  imageClassName?: string
  initialsClassName?: string
  alt?: string
}

export default function TenantBrandMark({
  logo,
  name,
  className,
  imageClassName,
  initialsClassName,
  alt,
}: TenantBrandMarkProps) {
  return (
    <div className={cn('overflow-hidden flex items-center justify-center text-emerald-700', logo ? 'bg-white border border-slate-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.08)]' : 'bg-emerald-100 border border-emerald-200', className)}>
      {logo ? (
        <img src={logo} alt={alt || name} className={cn('h-[78%] w-[78%] object-contain', imageClassName)} />
      ) : (
        <span className={cn('font-bold', initialsClassName)}>{getInitials(name)}</span>
      )}
    </div>
  )
}
