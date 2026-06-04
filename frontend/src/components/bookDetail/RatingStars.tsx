import { Star } from 'lucide-react'

type RatingStarsProps = {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  /** Mode interactif pour choisir une note */
  interactive?: boolean
  onChange?: (value: number) => void
  label?: string
}

const sizeClass = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function RatingStars({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  label,
}: RatingStarsProps) {
  const iconClass = sizeClass[size]

  return (
    <div
      className="inline-flex items-center gap-0.5"
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={label ?? `Note ${value} sur ${max}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= Math.round(value)

        if (interactive && onChange) {
          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={value === starValue}
              aria-label={`${starValue} étoile${starValue > 1 ? 's' : ''}`}
              onClick={() => onChange(starValue)}
              className="rounded p-0.5 text-amber-400 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Star
                className={`${iconClass} ${starValue <= value ? 'fill-amber-400' : 'fill-transparent'}`}
                strokeWidth={1.5}
                aria-hidden
              />
            </button>
          )
        }

        return (
          <Star
            key={starValue}
            className={`${iconClass} ${filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-amber-300/80'}`}
            strokeWidth={1.5}
            aria-hidden
          />
        )
      })}
    </div>
  )
}
