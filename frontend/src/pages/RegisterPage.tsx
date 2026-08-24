import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { getCsrfToken } from '../lib/csrf'
import { useAuth } from '../auth/useAuth'

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!consent) {
      setError('Vous devez accepter le traitement de vos données (RGPD).')
      return
    }
    setPending(true)
    try {
      const csrfToken = await getCsrfToken()
      await api.post(
        '/register',
        {
          pseudo,
          email,
          password,
          consentementRgpd: true,
        },
        { headers: { 'X-CSRF-Token': csrfToken } },
      )
      await login(email, password)
      navigate('/library')
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? String((err as { response?: { data?: { error?: string } } }).response?.data?.error)
          : null
      setError(msg || 'Inscription impossible.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
      <p className="mt-2 text-sm text-slate-600">Rejoignez LetterBook en quelques secondes.</p>

      <form className="mt-8 space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <label className="block text-sm font-medium text-slate-700">
          Pseudo
          <input
            required
            minLength={2}
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Mot de passe
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/30"
          />
          <span>J’accepte la conservation de mes données personnelles conformément au RGPD.</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow hover:opacity-95 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {pending ? 'Création…' : 'S’inscrire'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Déjà membre ?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
