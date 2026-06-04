import { expect, test } from '@playwright/test'
import { mockAuthenticatedSession } from '../fixtures/auth'
import { mockProfile } from '../fixtures/api-mocks'

test('Profile happy state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockProfile(page, 'happy')
  await page.goto('/profiles/42')
  await expect(page.getByText('@reader_full')).toBeVisible()
  await expect(page.getByText('Historique de lecture')).toBeVisible()
})

test('Profile empty state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockProfile(page, 'empty')
  await page.goto('/profiles/42')
  await expect(page.getByText('Aucun livre dans l’historique')).toBeVisible()
  await expect(page.getByText('Pas encore d’avis publics')).toBeVisible()
})

test('Profile error state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockProfile(page, 'error')
  await page.goto('/profiles/42')
  await expect(page.getByText('Profil introuvable.')).toBeVisible()
})

