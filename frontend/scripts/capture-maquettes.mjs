import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../../docs/screenshots-maquettes')
const baseURL = 'http://127.0.0.1:5173'
const email = process.env.LB_SCREENSHOT_EMAIL ?? 'admin@letterbook.local'
const password = process.env.LB_SCREENSHOT_PASSWORD ?? 'AdminLetterBook!2026'

async function shot(page, name, options = {}) {
  const file = path.join(outDir, name)
  await page.screenshot({ path: file, fullPage: options.fullPage ?? false })
  console.log(`✓ ${name}`)
}

async function login(page) {
  await page.goto(`${baseURL}/login`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
}

async function main() {
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({ channel: 'chrome' })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  await page.goto(`${baseURL}/`)
  await page.waitForLoadState('networkidle')
  await shot(page, '5.1-page-accueil.png', { fullPage: true })

  await page.goto(`${baseURL}/login`)
  await page.waitForLoadState('networkidle')
  await shot(page, '5.2-connexion.png')

  await page.goto(`${baseURL}/register`)
  await page.waitForLoadState('networkidle')
  await shot(page, '5.2-inscription.png')

  await login(page)

  await page.goto(`${baseURL}/library`)
  await page.waitForLoadState('networkidle')
  await shot(page, '5.3-bibliotheque.png', { fullPage: true })

  await page.goto(`${baseURL}/feed`)
  await page.waitForLoadState('networkidle')
  await shot(page, '5.6-fil-actualite.png', { fullPage: true })

  await page.goto(`${baseURL}/profiles/1`)
  await page.waitForLoadState('networkidle')
  await shot(page, '5.5-profil-utilisateur.png', { fullPage: true })

  const bookLink = page.locator('a[href^="/books/"]').first()
  if (await bookLink.count()) {
    const href = await bookLink.getAttribute('href')
    await page.goto(`${baseURL}${href}`)
    await page.waitForLoadState('networkidle')
    await shot(page, '5.4-fiche-livre.png', { fullPage: true })
  } else {
    await page.goto(`${baseURL}/books/3`)
    await page.waitForLoadState('networkidle')
    await shot(page, '5.4-fiche-livre.png', { fullPage: true })
  }

  await browser.close()
  console.log(`\nCaptures enregistrées dans ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
