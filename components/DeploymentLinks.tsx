import Link from 'next/link'

const deployments = [
  {
    // Production URL recorded in docs/adr/0001-workspace-auto-session-and-mcp.md.
    name: 'Daily Productivity',
    url: 'https://daily-productivity-wine.vercel.app/',
    repository: 'https://github.com/sungsulee1190-star/daily-productivity',
    status: '운영 URL 확인',
  },
  {
    name: '인쇄용지 MI 대시보드',
    url: 'https://sungsulee1190-star.github.io/pnwdashboard/',
    repository: 'https://github.com/sungsulee1190-star/pnwdashboard',
    status: 'GitHub Pages 배포 확인',
  },
  {
    name: '환율 대시보드',
    url: 'https://sungsulee1190-star.github.io/FX-Dashboard/',
    repository: 'https://github.com/sungsulee1190-star/FX-Dashboard',
    status: 'GitHub Pages 배포 확인',
  },
  {
    name: 'Widen Cosmetic',
    url: 'https://widen-cosmetic.vercel.app/',
    repository: 'https://github.com/sungsulee1190-star/widen_cosmetic',
    status: '운영 URL 응답 확인',
  },
]

interface DeploymentLinksProps {
  showQuickLinks?: boolean
  savedUrls?: string[]
  onSave?: (name: string, url: string) => void
}

export default function DeploymentLinks({ showQuickLinks = false, savedUrls = [], onSave }: DeploymentLinksProps) {
  return (
    <section id="deployments" aria-labelledby="deployments-heading" className="scroll-mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="deployments-heading" className="text-lg font-semibold">배포 앱</h2>
        {showQuickLinks && <Link href="/links" className="text-sm underline">빠른 링크 관리</Link>}
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-2)] text-xs text-[var(--text-secondary)]">
            <tr>
              <th scope="col" className="px-3 py-2.5">앱 이름</th>
              <th scope="col" className="px-3 py-2.5">배포 URL</th>
              <th scope="col" className="px-3 py-2.5">저장소</th>
              <th scope="col" className="px-3 py-2.5">상태</th>
              {onSave && <th scope="col" className="px-3 py-2.5">빠른 링크</th>}
            </tr>
          </thead>
          <tbody>
            {deployments.map(({ name, url, repository, status }) => (
              <tr key={repository} className="border-t border-[var(--border)]">
                <th scope="row" className="px-3 py-2.5 font-medium">{name}</th>
                <td className="min-w-40 break-all px-3 py-2.5">
                  <a href={url} target="_blank" rel="noreferrer" className="underline">{url}</a>
                </td>
                <td className="px-3 py-2.5">
                  <a href={repository} target="_blank" rel="noreferrer" className="underline">GitHub</a>
                </td>
                <td className="px-3 py-2.5">{status}</td>
                {onSave && (
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {savedUrls.some(saved => saved.trim().replace(/\/$/, '') === url.replace(/\/$/, '')) ? (
                      <span className="text-[var(--text-secondary)]">추가됨</span>
                    ) : (
                      <button type="button" onClick={() => onSave(name, url)} aria-label={`${name} 빠른 링크에 추가`} className="underline">
                        추가
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
