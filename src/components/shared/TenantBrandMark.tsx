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
    <div className={cn('overflow-hidden flex items-center justify-center bg-emerald-100 border border-emerald-200 text-emerald-700', className)}>
      {logo ? (
        <img src={logo} alt={alt || name} className={cn('h-full w-full object-cover', imageClassName)} />
      ) : (
        <span className={cn('font-bold', initialsClassName)}>{getInitials(name)}</span>
      )}
    </div>
  )
}
