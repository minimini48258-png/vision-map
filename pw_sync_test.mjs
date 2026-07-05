import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()

await context.addInitScript(() => {
  const state = {
    state: {
      groqApiKey: 'gsk_test_dummy',
      selfItems: [], issues: [], connections: [], plans: [],
      mapNodes: [], mapEdges: [],
      viewMode: 'mindmap', activeModule: 'self', aiMessages: [], aiPanelOpen: false,
    },
    version: 0
  }
  localStorage.setItem('vision-map-storage', JSON.stringify(state))
})

const page = await context.newPage()
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto('http://localhost:5175/vision-map/')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(1000)

// Add an item
const input = page.locator('input').filter({ hasText: '' }).nth(0)
await page.locator('input[placeholder*="森の中"]').fill('テスト項目')
await page.keyboard.press('Control+Enter')
await page.waitForTimeout(1500)
await page.screenshot({ path: 'sync_after.png' })

const nodeCount = await page.locator('.react-flow__node').count()
console.log('Node count:', nodeCount)

const nodeInfo = await page.evaluate(() => {
  const nodes = document.querySelectorAll('.react-flow__node')
  return Array.from(nodes).map(n => ({
    vis: window.getComputedStyle(n).visibility,
    text: n.textContent ? n.textContent.trim().substring(0, 30) : ''
  }))
})
console.log('Nodes:', JSON.stringify(nodeInfo))

await browser.close()
