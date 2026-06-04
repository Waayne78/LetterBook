import type { Page } from '@playwright/test'

export async function mockLibrary(page: Page, mode: 'happy' | 'empty' | 'error'): Promise<void> {
  await page.route('**/api/library**', async (route) => {
    if (mode === 'error') {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) })
      return
    }
    const items =
      mode === 'empty'
        ? []
        : [
            {
              id: 1,
              statut: 'en_cours',
              statutLabel: 'En cours',
              progression: 35,
              livre: {
                id: 3,
                titre: 'Les Miserables',
                auteur: 'Victor Hugo',
                couverture: null,
              },
            },
          ]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items }) })
  })
}

export async function mockSearch(page: Page, mode: 'happy' | 'empty' | 'error'): Promise<void> {
  await page.route('**/api/books/search**', async (route) => {
    if (mode === 'error') {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) })
      return
    }
    const payload =
      mode === 'empty'
        ? { local: [], google: [], meta: { googleConfigured: true, googleTotalItems: 0, googleStartIndex: 0, googlePageSize: 20, googleHasMore: false, googleError: null } }
        : {
            local: [{ id: 5, titre: 'Notre-Dame de Paris', auteur: 'Victor Hugo', couverture: null, genre: 'Roman', isbn: null, externalId: null }],
            google: [{ googleVolumeId: 'g-1', titre: 'Les Miserables', auteur: 'Victor Hugo', couverture: null, genre: 'Roman', isbn: '9782070368228' }],
            meta: { googleConfigured: true, googleTotalItems: 1, googleStartIndex: 0, googlePageSize: 20, googleHasMore: false, googleError: null },
          }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
}

export async function mockSettingsSave(page: Page, mode: 'happy' | 'error'): Promise<void> {
  await page.route('**/api/me/photo', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ photo: '/uploads/avatars/x.jpg' }) })
  })
  await page.route('**/api/me', async (route) => {
    if (route.request().method() === 'PATCH') {
      if (mode === 'error') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
      return
    }
    await route.fallback()
  })
}

export async function mockDiscover(page: Page, mode: 'happy' | 'empty' | 'error'): Promise<void> {
  await page.route('**/api/users/suggestions**', async (route) => {
    if (mode === 'error') {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) })
      return
    }
    const users =
      mode === 'empty'
        ? []
        : [{ id: 12, pseudo: 'reader_one', bio: null, photo: null, dateCreation: '2026-01-01T00:00:00+00:00', relationship: 'none' }]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users }) })
  })
  await page.route('**/api/users/search**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: [] }) })
  })
}

export async function mockProfile(page: Page, mode: 'happy' | 'empty' | 'error'): Promise<void> {
  await page.route('**/api/profiles/*', async (route) => {
    if (mode === 'error') {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not_found' }) })
      return
    }
    const payload =
      mode === 'empty'
        ? {
            user: { id: 42, pseudo: 'reader_zero', bio: null, photo: null, dateCreation: '2026-01-01T00:00:00+00:00' },
            stats: { livresBibliotheque: 0, avis: 0 },
            historiqueLecture: [],
            derniersAvis: [],
          }
        : {
            user: { id: 42, pseudo: 'reader_full', bio: 'Bio', photo: null, dateCreation: '2026-01-01T00:00:00+00:00' },
            stats: { livresBibliotheque: 2, avis: 1 },
            historiqueLecture: [{ id: 1, livre: { id: 8, titre: 'Book A', auteur: 'Author A', couverture: null } }],
            derniersAvis: [{ id: 7, note: 4, contenu: 'Excellent', livre: { titre: 'Book A' } }],
          }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
}

