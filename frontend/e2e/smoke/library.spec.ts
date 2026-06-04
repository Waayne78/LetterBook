import { expect, test } from '@playwright/test'
import { mockAuthenticatedSession } from '../fixtures/auth'
import { mockLibrary } from '../fixtures/api-mocks'

test('Library happy state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockLibrary(page, 'happy')
  await page.goto('/library')
  await expect(page.getByRole('heading', { name: 'Ma bibliothèque' })).toBeVisible()
  await expect(page.getByText('Les Miserables')).toBeVisible()
})

test('Library empty state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockLibrary(page, 'empty')
  await page.goto('/library')
  await expect(page.getByText('Votre bibliothèque est vide')).toBeVisible()
})

test('Library error state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockLibrary(page, 'error')
  await page.goto('/library')
  await expect(page.getByText('Impossible de charger la bibliothèque.')).toBeVisible()
})

