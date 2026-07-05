import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()

await context.addInitScript(() => {
  const state = {
    state: {
      groqApiKey: 'gsk_test_dummy',
      selfItems: [{ id: 'test1', type: 'love', content: '森の中を歩くこと' }],
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

// Get details on the node
const nodeInfo = await page.evaluate(() => {
  const node = document.querySelector('.react-flow__node')
  if (!node) return 'no node found'
  const style = window.getComputedStyle(node)
  const rect = node.getBoundingClientRect()
  return {
    transform: node.style.transform,
    opacity: style.opacity,
    visibility: style.visibility,
    display: style.display,
    rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
    innerHTML: node.innerHTML.substring(0, 200),
  }
})

// Get viewport pane transform
const paneInfo = await page.evaluate(() => {
  const panes = document.querySelectorAll('[class*="pane"], [class*="viewport"], [class*="transform"]')
  return Array.from(panes).map(el => ({
    class: el.className.substring(0, 80),
    transform: el.style.transform,
  }))
})

console.log('Node info:', JSON.stringify(nodeInfo, null, 2))
console.log('Pane transforms:', JSON.stringify(paneInfo, null, 2))

await browser.close()
