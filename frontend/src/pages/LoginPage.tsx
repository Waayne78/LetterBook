import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(email, password)
      const safeRedirect =
        redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/library'
      navigate(safeRedirect)
    } catch {
      setError('Identifiants invalides ou compte suspendu.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <h1 className="text-2xl font-bold text-slate-900">Bon retour</h1>
      <p className="mt-2 text-sm text-slate-600">Connectez-vous pour retrouver votre bibliothèque.</p>

      <form className="mt-8 space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            placeholder="vous@exemple.com"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Mot de passe
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow hover:opacity-95 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {pending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
