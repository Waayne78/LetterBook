import { expect, test } from '@playwright/test'
import { mockAuthenticatedSession } from '../fixtures/auth'
import { mockSearch } from '../fixtures/api-mocks'

async function runSearch(page: import('@playwright/test').Page): Promise<void> {
  await page.getByPlaceholder('Rechercher un titre, un auteur ou un ISBN…').fill('victor')
}

test('Search happy state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockSearch(page, 'happy')
  await page.goto('/search')
  await runSearch(page)
  await expect(page.getByRole('heading', { name: 'Sur LetterBook' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Catalogue étendu' })).toBeVisible()
})

test('Search empty state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockSearch(page, 'empty')
  await page.goto('/search')
  await runSearch(page)
  await expect(page.getByText('Aucun résultat')).toBeVisible()
})

test('Search error state', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockSearch(page, 'error')
  await page.goto('/search')
  await runSearch(page)
  await expect(page.getByRole('alert')).toBeVisible()
})

