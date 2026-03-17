'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { migrateLocalDataToSupabase } from '@/lib/migrate-local-data'

type BannerState = 'idle' | 'migrating' | 'done' | 'hidden'

export default function MigrationBanner() {
  const { user } = useAuth()
  const [bannerState, setBannerState] = useState<BannerState>('idle')
  const [migratedCount, setMigratedCount] = useState(0)

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
      } catch {
        // Silent failure — don't block the user
        if (!cancelled) setBannerState('hidden')
      }
    }

    runMigration()

    return () => {
      cancelled = true
    }
  }, [user])

  if (bannerState === 'idle' || bannerState === 'hidden') return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        padding: '12px 18px',
        borderRadius: '12px',
        backgroundColor: bannerState === 'done' ? '#DCFCE7' : 'var(--surface)',
        border: `1px solid ${bannerState === 'done' ? '#86EFAC' : 'var(--border)'}`,
        color: bannerState === 'done' ? '#15803D' : 'var(--text-secondary)',
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
