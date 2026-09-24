import clsx from 'clsx'

const BUBBLE = 'M34 7H70A27 27 0 0 1 97 34V64L103 69H34A27 27 0 0 1 7 42V34A27 27 0 0 1 34 7Z'

export function Isotype({ className, gradient = false }: { className?: string; gradient?: boolean }) {
  return (
    <svg viewBox="0 0 110 76" className={className} aria-hidden>
      {gradient && (
        <defs>
          <linearGradient id="cid-brand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFC83D" />
            <stop offset="0.38" stopColor="#FF6B1A" />
            <stop offset="0.72" stopColor="#F23D8C" />
            <stop offset="1" stopColor="#8B3DF2" />
          </linearGradient>
        </defs>
      )}
      <path
        d={BUBBLE}
        fill="none"
        stroke={gradient ? 'url(#cid-brand)' : 'currentColor'}
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <circle cx="39" cy="38" r="7.5" fill={gradient ? '#FF6B1A' : 'currentColor'} />
      <circle cx="65" cy="38" r="7.5" fill={gradient ? '#F23D8C' : 'currentColor'} />
    </svg>
  )
}

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <Isotype className="h-[26px] w-auto text-cid" />
      <div className="leading-none">
        <div className="flex items-start text-[21px] tracking-[-0.03em] text-ink">
          <span className="font-light">CID</span>
          <span className="font-bold">360</span>
          <span className="ml-[1px] mt-[1px] text-[8px] font-medium text-ink-2">®</span>
        </div>
        {!compact && (
          <div className="mt-[3px] hidden text-[9.5px] sm:block font-medium tracking-[0.01em] text-ink-3">
            Centro de Calidad, Insights y Desarrollo
          </div>
        )}
      </div>
    </div>
  )
}
