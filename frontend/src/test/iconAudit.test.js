import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'

const srcDir = resolve(__dirname, '../pages')
const indexHtml = resolve(__dirname, '../../index.html')

function getAllJsxFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...getAllJsxFiles(full))
    } else if (/\.(jsx?|tsx?)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

describe('Icon Audit', () => {
  it('no ri- class references in frontend source files', () => {
    const files = getAllJsxFiles(srcDir)
    const violations = []
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      const matches = content.match(/class(Name)?=["'][^"']*ri-[a-z]+/gi)
      if (matches) {
        violations.push({ file, matches })
      }
    }
    expect(violations).toEqual([])
  })

  it('no remix icon CDN links in index.html', () => {
    const html = readFileSync(indexHtml, 'utf-8')
    expect(html.toLowerCase()).not.toContain('remixicon')
  })
})
