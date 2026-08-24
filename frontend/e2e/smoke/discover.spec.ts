import { expect, test } from '@playwright/test'
import { mockAuthenticatedSession } from '../fixtures/auth'
import { mockDiscover } from '../fixtures/api-mocks'

test('Discover happy state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockDiscover(page, 'happy')
  await page.goto('/discover')
  await expect(page.getByRole('heading', { name: 'Lecteurs recommandés' })).toBeVisible()
  await expect(page.getByText('@reader_one')).toBeVisible()
})

test('Discover empty state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockDiscover(page, 'empty')
  await page.goto('/discover')
  await expect(page.getByText('Pas de suggestions pour le moment')).toBeVisible()
})

test('Discover error state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockDiscover(page, 'error')
  await page.goto('/discover')
  await expect(page.getByText('Impossible de charger les suggestions pour le moment.')).toBeVisible()
})

