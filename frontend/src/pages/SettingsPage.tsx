import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Camera, KeyRound, LogOut, Mail, Save, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../components/ui/useToast'

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
const sectionClass = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8'

export function SettingsPage() {
  const { user, logout, refreshMe } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [pseudo, setPseudo] = useState('')
  const [bio, setBio] = useState('')
  const [photo, setPhoto] = useState('')
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [profilePending, setProfilePending] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deletePending, setDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [exportPending, setExportPending] = useState(false)

  useEffect(() => {
    if (user) {
      setPseudo(user.pseudo)
      setBio(user.bio ?? '')
      setPhoto(user.photo ?? '')
      setSelectedPhotoFile(null)
      setSelectedPhotoPreview(null)
    }
  }, [user])

  useEffect(() => {
    if (!selectedPhotoFile) {
      setSelectedPhotoPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(selectedPhotoFile)
    setSelectedPhotoPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedPhotoFile])

  const initials = useMemo(() => {
    if (!user?.pseudo) {
      return '?'
    }
    return user.pseudo
      .split(/\s+/)
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  function onPhotoFileChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null
    setSelectedPhotoFile(next)
    if (next === null && !photo) {
      setPhoto('')
    }
  }

  function removePhoto() {
    setSelectedPhotoFile(null)
    setSelectedPhotoPreview(null)
    setPhoto('')
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    setProfilePending(true)
    try {
      let finalPhoto = photo.trim() || null
      if (selectedPhotoFile) {
        const formData = new FormData()
        formData.append('photo', selectedPhotoFile)
        const { data: uploadData } = await api.post<{ photo: string }>('/me/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        finalPhoto = uploadData.photo
        setPhoto(uploadData.photo)
        setSelectedPhotoFile(null)
        setSelectedPhotoPreview(null)
      }

      const body: Record<string, string | null> = {
        pseudo: pseudo.trim(),
        bio: bio.trim() || null,
        photo: finalPhoto,
      }
      if (password.length >= 8) {
        if (currentPassword.length === 0) {
          toast({
            title: 'Mot de passe actuel requis',
            description: 'Indiquez votre mot de passe actuel pour en définir un nouveau.',
            variant: 'error',
          })
          setProfilePending(false)
          return
        }
        body.password = password
        body.currentPassword = currentPassword
      }
      await api.patch('/me', body)
      await refreshMe()
      setPassword('')
      setCurrentPassword('')
      toast({ title: 'Profil mis à jour.' })
    } catch {
      toast({ title: 'Impossible d’enregistrer le profil.', variant: 'error' })
    } finally {
      setProfilePending(false)
    }
  }

  async function exportData() {
    setExportPending(true)
    try {
      const { data } = await api.get<Record<string, unknown>>('/me/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `letterbook-export-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Export téléchargé.' })
    } catch {
      toast({ title: 'Impossible d’exporter vos données.', variant: 'error' })
    } finally {
      setExportPending(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  async function deleteAccount() {
    if (deleteConfirm !== user?.pseudo) {
      setDeleteError('Saisissez votre pseudo exactement pour confirmer.')
      return
    }
    if (deletePassword.length === 0) {
      setDeleteError('Saisissez votre mot de passe pour confirmer.')
      return
    }
    setDeleteError(null)
    setDeletePending(true)
    try {
      await api.delete('/me', { data: { password: deletePassword } })
      logout()
      navigate('/', { replace: true })
    } catch {
      toast({
        title: 'Suppression impossible',
        description: 'Vérifiez votre mot de passe puis réessayez.',
        variant: 'error',
      })
      setDeletePending(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-primary via-slate-900 to-slate-950 p-8 text-primary-foreground shadow-[0_24px_60px_-24px_rgba(15,23,42,0.55)] md:p-10">
        <div className="pointer-events-none absolute" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Mon compte</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Paramètres</h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300 md:text-base">
              Personnalisez votre profil public, renforcez la sécurité de votre compte et gérez vos données.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
            <p className="text-xs text-slate-300">Connecté en tant que</p>
            <p className="mt-1 text-lg font-semibold">{user.pseudo}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-300">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:grid-rows-[auto_auto]">
        <section className={`${sectionClass} h-full lg:col-start-1 lg:row-start-1`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-primary">Profil public</h2>
                <p className="mt-1 text-sm text-muted">
                  Ces informations sont visibles sur votre page profil.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <UserRound className="h-4 w-4" aria-hidden />
              </span>
            </div>

            <form className="mt-6 space-y-4" onSubmit={(e) => void saveProfile(e)}>
              <label className="block text-sm font-medium text-slate-700">
                Pseudo
                <input
                  required
                  minLength={2}
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Bio
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Parlez de vos goûts de lecture, genres favoris, auteurs préférés…"
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Photo de profil
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-slate-50">
                      Choisir une image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={onPhotoFileChange}
                        className="sr-only"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Retirer la photo
                    </button>
                    <span className="text-xs text-slate-500">PNG/JPG/WEBP/GIF, max 2 Mo</span>
                  </div>
                  {selectedPhotoFile && (
                    <p className="mt-2 text-xs text-emerald-700">
                      Nouveau fichier sélectionné : {selectedPhotoFile.name}
                    </p>
                  )}
                </div>
              </label>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={profilePending}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <Save className="h-4 w-4" aria-hidden />
                  {profilePending ? 'Enregistrement…' : 'Enregistrer les modifications'}
                </button>
                <Link to={`/profiles/${user.id}`} className="text-sm font-semibold text-link hover:underline">
                  Voir mon profil public →
                </Link>
              </div>
            </form>
          </section>

          <section className={`${sectionClass} h-full lg:col-start-1 lg:row-start-2`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-primary">Sécurité</h2>
                <p className="mt-1 text-sm text-muted">
                  Modifiez votre mot de passe pour garder votre compte protégé.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Mot de passe actuel
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Nouveau mot de passe (optionnel, 8 caractères min.)
                <input
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </label>
              <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <KeyRound className="h-3.5 w-3.5" aria-hidden />
                Le mot de passe n’est mis à jour que si vous renseignez les deux champs.
              </p>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-semibold text-slate-900">Session</h3>
              <p className="mt-1 text-sm text-muted">Terminez votre session sur cet appareil.</p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Déconnexion
              </button>
            </div>
          </section>

          <section className={`${sectionClass} flex h-full flex-col lg:col-start-2 lg:row-start-1`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Aperçu profil</h3>
            <div className="mt-4 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                {selectedPhotoPreview ? (
                  <img
                    src={selectedPhotoPreview}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                  />
                ) : photo.trim() ? (
                  <img
                    src={photo.trim()}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-slate-800 text-sm font-bold text-primary-foreground">
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-primary">@{pseudo || user.pseudo}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-4 text-sm text-slate-600">
                {bio.trim() || 'Ajoutez une bio pour présenter vos goûts de lecture.'}
              </p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
                <Camera className="h-3.5 w-3.5" aria-hidden />
                Mise à jour en direct pendant l’édition
              </p>
            </div>
          </section>

          <section className={`${sectionClass} lg:col-span-2`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Données personnelles (RGPD)</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Téléchargez une copie de vos données (profil, bibliothèque, avis, commentaires, réseau).
                </p>
              </div>
              <button
                type="button"
                disabled={exportPending}
                onClick={() => void exportData()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                {exportPending ? 'Export…' : 'Exporter mes données'}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-red-200 bg-gradient-to-b from-red-50 to-red-50/70 p-6 shadow-sm md:p-8 lg:col-start-2 lg:row-start-2 lg:h-full">
            <div className="flex h-full flex-col space-y-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold leading-tight text-red-900">Supprimer mon compte</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-red-800">
                    Action irréversible : vos données personnelles seront supprimées. Vos avis publics resteront visibles
                    sous le nom « Utilisateur supprimé ».
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-red-900">
                  Confirmez avec <span className="font-mono font-bold">{user.pseudo}</span>
                </label>
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                />
                <label className="block text-sm font-medium text-red-900">
                  Mot de passe
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    autoComplete="current-password"
                  />
                </label>
                {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
              </div>

              <button
                type="button"
                disabled={deletePending}
                onClick={() => void deleteAccount()}
                className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {deletePending ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </section>
      </div>
    </div>
  )
}
