import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()

await context.addInitScript(() => {
  const state = {
    state: {
      groqApiKey: 'gsk_test_dummy',
      selfItems: [
        { id: 'test1', type: 'love', content: '森の中を歩くこと' },
        { id: 'test2', type: 'skill', content: 'データ分析' },
      ],
      issues: [{ id: 'issue1', title: '若者の流出', category: 'population' }],
      connections: [],
      plans: [],
      mapNodes: [
        { id: 'n1', type: 'self', label: '森の中を歩くこと', position: { x: 150, y: 150 } },
        { id: 'n2', type: 'self', label: 'データ分析', position: { x: 400, y: 150 } },
        { id: 'n3', type: 'issue', label: '若者の流出', position: { x: 270, y: 300 } },
      ],
      mapEdges: [],
      viewMode: 'mindmap',
      activeModule: 'self',
      aiMessages: [],
      aiPanelOpen: false,
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
await page.screenshot({ path: 'mindmap_main.png' })
await browser.close()
console.log('done')
