# 에이전트 관리·배포 앱 연결 릴리스

## 범위
- /agents: 로그인 계정의 프로젝트·업무 후속 할 일 조회, 프로젝트 태그 필터, 오류/빈 상태, 갱신.
- /agents 및 /links: GitHub/운영 응답으로 확인한 배포 앱 4개 연결. Daily Productivity, pnwdashboard, FX-Dashboard, Widen Cosmetic.
- 프로젝트 동기화 시 기존 repo_url·tech_stack 덮어쓰기 방지.
- 기존 사용자 변경은 별도 원본 작업 폴더에 보존. 이번 변경은 별도 worktree에서 검증.

## 실제 검증
- npm ci --ignore-scripts --prefer-offline --no-audit --no-fund 성공.
- npm run build 전체 통과 (/agents 포함 21개 정적 페이지).
- npx eslint app/agents/page.tsx components/DeploymentLinks.tsx store/linkStore.ts 통과.
- 로컬 production 서버 /agents HTTP 200.
- 실제 Supabase→브라우저: 프로젝트 4개, 미완료 업무 14개, 오류 표시 없음.
- 매니징 보드 필터: 해당 프로젝트 후속 할 일 2개 표시.
- /links 배포 앱 4개 및 빠른 링크 추가 버튼 4개 표시. 검증 중 DB 쓰기/삭제 없음.
- GitHub Pages API에서 pnwdashboard/FX-Dashboard built 및 실제 URL 확인, 각 URL HTTP 200.
- Widen Cosmetic GitHub homepage 및 URL HTTP 200 확인.

## 의도적으로 분리한 변경·위험
- Codex가 작성한 계정별 캐시 분리와 자동 로그인 제거는 이번 배포에 넣지 않음. 사용자가 비밀번호를 모른다고 했으므로 접근 방식을 일방적으로 바꾸지 않기 위함.
- 기존 공용 자동 로그인은 보안 위험이 있는 선행 구조임. 이번 기능 추가가 이를 해결한 것은 아님. 별도 인증 전환·접근 제어·기존 자격증명 교체가 필요하며 계정 값은 이 문서에 기록하지 않음.
- 이 화면은 상태/후속 할 일 조회 보드이며, 에이전트를 원격 실행하는 제어판 또는 조직도·메모리 상세 기능 완료를 뜻하지 않음.
- 배포 앱 상태는 검증 시점의 기록이며 상시 상태 모니터가 아님.

## 운영 배포
- 기존 GitHub main→Vercel 연결로 배포. 배포 SHA와 운영 화면 결과는 완료 후 작업 로그에 기록.
