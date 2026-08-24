import { type FormEvent, useEffect, useId, useState } from 'react'
import { BookOpen, Menu, Settings, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { BookSearchField } from './bookSearch/BookSearchField'
import { NotificationBell } from './notifications/NotificationBell'
import { UserAvatar } from './ui/UserAvatar'

const desktopNavLink = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    isActive
      ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/90'
      : 'text-slate-600 hover:bg-white/60 hover:text-primary',
  ].join(' ')

const mobileNavLink = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-xl px-4 py-3 text-base font-medium transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
    isActive ? 'bg-primary text-primary-foreground' : 'text-slate-800 hover:bg-slate-100',
  ].join(' ')

function BookLogoMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-slate-800 text-primary-foreground shadow-md ring-1 ring-white/10 ${className}`}
      aria-hidden
    >
      <BookOpen className="h-5 w-5" strokeWidth={1.5} />
    </span>
  )
}

export function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const menuId = useId()

  const isAdmin = user?.roles?.includes('ROLE_ADMIN')

  useEffect(() => {
    if (!mobileOpen) {
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function submitSearch(e: FormEvent) {
    e.preventDefault()
    const q = searchQ.trim()
    const searchUrl = `/search${q ? `?q=${encodeURIComponent(q)}` : ''}`
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(searchUrl)}`)
      setMobileOpen(false)
      return
    }
    navigate(searchUrl)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 shadow-[0_1px_0_0_rgba(15,23,42,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-[4.25rem] items-center gap-3 sm:gap-4 lg:gap-6">
          {/* Logo */}
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-3 rounded-xl py-1 pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => setMobileOpen(false)}
          >
            <BookLogoMark />
            <div className="hidden min-[380px]:block">
              <span className="block text-lg font-bold tracking-tight text-primary">LetterBook</span>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Lecteurs &amp; avis
              </span>
            </div>
          </Link>

          {/* Recherche — desktop / tablette */}
          <form
            onSubmit={(e) => void submitSearch(e)}
            className="mx-auto hidden min-w-0 flex-1 md:block md:max-w-lg lg:max-w-xl"
            role="search"
          >
            <BookSearchField
              id="nav-search"
              label="Rechercher un livre"
              variant="compact"
              value={searchQ}
              onValueChange={setSearchQ}
              placeholder="Livres, auteurs, ISBN…"
            />
          </form>

          {/* Navigation desktop */}
          <nav
            className="hidden items-center rounded-full bg-slate-100/95 p-1 ring-1 ring-slate-200/90 md:flex"
            aria-label="Principal"
          >
            <NavLink to="/feed" className={desktopNavLink}>
              Fil
            </NavLink>
            <NavLink to="/library" className={desktopNavLink}>
              Bibliothèque
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={desktopNavLink}>
                Admin
              </NavLink>
            )}
          </nav>

          {/* Actions droite */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <NotificationBell />
                <Link
                  to="/settings"
                  className="hidden rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex"
                  title="Paramètres"
                >
                  <Settings className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to={`/profiles/${user.id}`}
                  className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:inline-flex"
                  title="Mon profil"
                >
                  <UserAvatar pseudo={user.pseudo} photo={user.photo} className="h-5 w-5 shadow-sm" textClassName="text-[10px]" />
                  <span className="max-w-[7rem] truncate">{user.pseudo}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:inline-flex"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="hidden rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-md transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:inline-flex"
                >
                  Rejoindre
                </Link>
              </>
            )}

            {/* Menu mobile */}
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
              aria-expanded={mobileOpen}
              aria-controls={menuId}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? (
                <X className="h-6 w-6" strokeWidth={2} />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Ligne recherche mobile */}
        <form
          onSubmit={(e) => void submitSearch(e)}
          className="border-t border-slate-100 pb-3 md:hidden"
          role="search"
        >
          <div className="pt-3">
            <BookSearchField
              id="nav-search-mobile"
              label="Rechercher un livre"
              variant="compact"
              value={searchQ}
              onValueChange={setSearchQ}
              placeholder="Livres, auteurs, ISBN…"
              className="rounded-xl"
            />
          </div>
        </form>
      </div>

      {/* Panneau mobile plein écran */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" id={menuId}>
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <span className="font-semibold text-primary">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Mobile">
              <NavLink to="/feed" className={mobileNavLink} onClick={() => setMobileOpen(false)}>
                Fil d’actualité
              </NavLink>
              <NavLink to="/library" className={mobileNavLink} onClick={() => setMobileOpen(false)}>
                Ma bibliothèque
              </NavLink>
              {user && (
                <>
                  <NavLink to="/settings" className={mobileNavLink} onClick={() => setMobileOpen(false)}>
                    Paramètres
                  </NavLink>
                </>
              )}
              {isAdmin && (
                <NavLink to="/admin" className={mobileNavLink} onClick={() => setMobileOpen(false)}>
                  Administration
                </NavLink>
              )}
            </nav>
            <div className="border-t border-slate-100 p-4">
              {user ? (
                <Link
                  to={`/profiles/${user.id}`}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  <UserAvatar pseudo={user.pseudo} photo={user.photo} className="h-10 w-10" textClassName="text-sm" />
                  <span className="truncate font-medium text-slate-800">{user.pseudo}</span>
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-primary hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-xl bg-accent py-3 text-center text-sm font-semibold text-accent-foreground shadow-md hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    onClick={() => setMobileOpen(false)}
                  >
                    Créer un compte
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
