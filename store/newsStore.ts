'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface NewsLink {
  id: string
  title: string
  url: string
  category: string
}

interface NewsStore {
  links: NewsLink[]
  addLink: (link: Omit<NewsLink, 'id'>) => void
  deleteLink: (id: string) => void
}

const defaultLinks: NewsLink[] = [
  { id: 'default-1', title: '네이버 증권 리서치', url: 'https://m.stock.naver.com/investment/research/invest', category: '경제/투자' },
  { id: 'default-2', title: 'KIEP 대외경제정책연구원', url: 'https://www.kiep.go.kr/aif/index.es?sid=a3&systemcode=02', category: '해외시장' },
  { id: 'default-3', title: 'KOTRA 해외시장뉴스', url: 'https://dream.kotra.or.kr/kotranews/index.do', category: '해외시장' },
  { id: 'default-4', title: '네이버 뉴스 신문', url: 'https://m.news.naver.com/newspaper/home?viewType=pc', category: '종합뉴스' },
]

export const useNewsStore = create<NewsStore>()(
  persist(
    (set) => ({
      links: defaultLinks,
      addLink: (link) =>
        set((s) => ({ links: [...s.links, { ...link, id: crypto.randomUUID() }] })),
      deleteLink: (id) =>
        set((s) => ({ links: s.links.filter((l) => l.id !== id) })),
    }),
    { name: 'daily-productivity-news' }
  )
)
