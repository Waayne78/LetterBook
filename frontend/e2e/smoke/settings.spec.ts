import { expect, test } from '@playwright/test'
import { mockAuthenticatedSession } from '../fixtures/auth'
import { mockSettingsSave } from '../fixtures/api-mocks'

test('Settings happy save', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockSettingsSave(page, 'happy')
  await page.goto('/settings')
  await page.getByLabel('Pseudo').fill('Milane2')
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(page.getByText('Profil mis à jour.')).toBeVisible()
})

test('Settings empty preview fallback', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockSettingsSave(page, 'happy')
  await page.goto('/settings')
  await page.getByLabel('Bio').fill('')
  await expect(page.getByText('Ajoutez une bio pour présenter vos goûts de lecture.')).toBeVisible()
})

test('Settings error save', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockSettingsSave(page, 'error')
  await page.goto('/settings')
  await page.getByLabel('Pseudo').fill('Milane2')
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
  await expect(page.getByText('Impossible d’enregistrer le profil.')).toBeVisible()
})

