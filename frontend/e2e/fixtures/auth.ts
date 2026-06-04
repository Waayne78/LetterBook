import type { Page } from '@playwright/test'

export async function mockAuthenticatedSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('lb_token', 'e2e-token')
  })

  await page.route('**/api/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 10,
        pseudo: 'Milane',
        email: 'milane@example.test',
        photo: null,
        bio: 'Lectrice passionnee',
        dateCreation: '2026-01-01T00:00:00+00:00',
        roles: ['ROLE_USER'],
        consentementRgpd: true,
      }),
    })
  })

  await page.route('**/api/library**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      })
      return
    }
    await route.fallback()
  })

  await page.route('**/api/me/notifications**', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], unreadCount: 0 }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })
}

