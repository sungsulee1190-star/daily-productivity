'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { migrateLocalDataToSupabase } from '@/lib/migrate-local-data'

type BannerState = 'idle' | 'migrating' | 'done' | 'error' | 'hidden'

export default function MigrationBanner() {
  const { user } = useAuth()
  const [bannerState, setBannerState] = useState<BannerState>('idle')
  const [migratedCount, setMigratedCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function runMigration() {
      if (typeof window === 'undefined') return
      if (localStorage.getItem('supabase-migration-done') === 'true') return

      setBannerState('migrating')
      try {
        const result = await migrateLocalDataToSupabase(user!.id)
        if (cancelled) return

        if (result.migrated) {
          setMigratedCount(result.count)
          setBannerState('done')
          setTimeout(() => {
            if (!cancelled) setBannerState('hidden')
          }, 3000)
        } else {
          setBannerState('hidden')
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : String(e))
          setBannerState('error')
        }
      }
    }

    runMigration()

    return () => {
      cancelled = true
    }
  }, [user])

  if (bannerState === 'idle' || bannerState === 'hidden') return null

  const bgColor = bannerState === 'done' ? '#DCFCE7' : bannerState === 'error' ? '#FEE2E2' : 'var(--surface)'
  const borderColor = bannerState === 'done' ? '#86EFAC' : bannerState === 'error' ? '#FCA5A5' : 'var(--border)'
  const textColor = bannerState === 'done' ? '#15803D' : bannerState === 'error' ? '#DC2626' : 'var(--text-secondary)'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        padding: '12px 18px',
        borderRadius: '12px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {bannerState === 'migrating' && (
        <>
          <span
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          기존 데이터를 불러오는 중...
        </>
      )}
      {bannerState === 'done' && (
        <>
          <span>✓</span>
          데이터 이전 완료 ({migratedCount}개 항목)
        </>
      )}
      {bannerState === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>⚠ 데이터 이전 실패</span>
          {errorMsg && <span style={{ fontSize: '12px', opacity: 0.8 }}>{errorMsg}</span>}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
