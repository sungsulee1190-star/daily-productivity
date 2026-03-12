// 간단한 SVG → 데이터URI 기반 PNG 생성 (Canvas API 없이)
// 실제로는 SVG 파일을 public/icons에 복사하는 방식으로 대체

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const dir = join(process.cwd(), 'public', 'icons')
mkdirSync(dir, { recursive: true })

// 192x192 SVG 아이콘
const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="#F97316"/>
  <text x="96" y="120" font-size="90" text-anchor="middle" font-family="sans-serif">✦</text>
  <text x="96" y="160" font-size="22" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold">데일리</text>
</svg>`

// 512x512 SVG 아이콘
const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#F97316"/>
  <text x="256" y="310" font-size="240" text-anchor="middle" font-family="sans-serif">✦</text>
  <text x="256" y="430" font-size="60" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold">데일리</text>
</svg>`

writeFileSync(join(dir, 'icon-192.svg'), svg192)
writeFileSync(join(dir, 'icon-512.svg'), svg512)

console.log('SVG icons created in public/icons/')
