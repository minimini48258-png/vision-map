import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()

await context.addInitScript(() => {
  const state = {
    state: {
      groqApiKey: 'gsk_test_dummy',
      selfItems: [
        { id: 'test1', type: 'love', content: '森の中を歩くこと' },
      ],
      issues: [],
      connections: [],
      plans: [],
      mapNodes: [
        { id: 'n1', type: 'self', label: '森の中を歩くこと', position: { x: 150, y: 150 } },
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

// Check ReactFlow nodes in DOM
const nodeCount = await page.locator('.react-flow__node').count()
const rfViewport = await page.locator('.react-flow__viewport').getAttribute('transform')
const containerBounds = await page.locator('.react-flow').boundingBox()
const consoleErrors = []
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

console.log('ReactFlow node count:', nodeCount)
console.log('Viewport transform:', rfViewport)
console.log('ReactFlow container bounds:', JSON.stringify(containerBounds))

// Check localStorage key
const storageKey = await page.evaluate(() => Object.keys(localStorage))
console.log('localStorage keys:', storageKey)

await page.screenshot({ path: 'debug_mindmap.png' })
await browser.close()
