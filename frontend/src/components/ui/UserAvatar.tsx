import { useEffect, useState } from 'react'

type UserAvatarProps = {
  pseudo: string
  photo?: string | null
  className?: string
  textClassName?: string
}

function initialsFromPseudo(pseudo: string): string {
  return pseudo
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function UserAvatar({ pseudo, photo, className = '', textClassName = '' }: UserAvatarProps) {
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setErrored(false)
  }, [photo])

  if (photo && !errored) {
    return (
      <img
        src={photo}
        alt=""
        className={`rounded-full object-cover ${className}`}
        onError={() => setErrored(true)}
      />
    )
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-slate-800 font-bold text-primary-foreground ${className} ${textClassName}`}
      aria-hidden
    >
      {initialsFromPseudo(pseudo)}
    </span>
  )
}
