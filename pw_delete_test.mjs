import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()

await context.addInitScript(() => {
  const state = {
    state: {
      groqApiKey: 'gsk_test_dummy',
      selfItems: [
        { id: 'item1', type: 'love', content: '削除テスト項目' },
        { id: 'item2', type: 'skill', content: '残す項目' },
      ],
      issues: [],
      connections: [],
      plans: [],
      mapNodes: [
        { id: 'node-self-item1', type: 'self', label: '削除テスト項目', refId: 'item1', position: { x: 200, y: 200 } },
        { id: 'node-self-item2', type: 'self', label: '残す項目', refId: 'item2', position: { x: 400, y: 200 } },
      ],
      mapEdges: [],
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
await page.waitForTimeout(1500)

const beforeCount = await page.locator('.react-flow__node').count()
await page.screenshot({ path: 'delete_before.png' })
console.log('Before delete - node count:', beforeCount)

// Click delete button on first item
const deleteBtn = page.locator('button').filter({ has: page.locator('svg') }).first()
// Find trash icon near "削除テスト項目"
const itemCard = page.locator('text=削除テスト項目').first()
await itemCard.hover()
const trashBtn = page.locator('.react-flow__node').first().locator('..').locator('button[title*="削除"], button:has(svg)').first()

// Use the trash icon button in the card
await page.locator('text=削除テスト項目').locator('xpath=ancestor::div[contains(@class,"rounded-xl")]').locator('button:last-child').click()
await page.waitForTimeout(1000)

const afterCount = await page.locator('.react-flow__node').count()
await page.screenshot({ path: 'delete_after.png' })
console.log('After delete - node count:', afterCount)

// Check Zustand state via localStorage
const storedState = await page.evaluate(() => {
  const s = localStorage.getItem('vision-map-storage')
  return s ? JSON.parse(s).state : null
})
console.log('mapNodes after delete:', storedState?.mapNodes?.map((n) => n.label))

await browser.close()
