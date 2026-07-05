import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()

await context.addInitScript(() => {
  const state = {
    state: {
      groqApiKey: 'gsk_test_dummy',
      selfItems: [{ id: 's1', type: 'love', content: '地域との共生' }],
      issues: [{ id: 'i1', title: '若者の流出', category: 'population' }],
      connections: [], plans: [],
      mapNodes: [], mapEdges: [],
      issueMapEdges: [], issueMapPositions: {},
      businessNodes: [{ id: 'b1', label: '地域新電力事業' }],
      viewMode: 'issuemap', activeModule: 'self', aiMessages: [], aiPanelOpen: false,
    },
    version: 0
  }
  localStorage.setItem('vision-map-storage', JSON.stringify(state))
})

const page = await context.newPage()
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto('http://localhost:5175/vision-map/')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(2000)
await page.screenshot({ path: 'issuemap_check.png' })
await browser.close()
console.log('done')
