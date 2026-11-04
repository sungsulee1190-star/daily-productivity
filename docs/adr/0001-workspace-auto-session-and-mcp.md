---
status: accepted
---
# 0001. 단일 워크스페이스 자동 세션 및 Stdio MCP 서버 연동

Supabase 서버에 Google OAuth(`external.google: false`)가 비활성화되어 있고 이메일 자동 승인(`mailer_autoconfirm: true`)만 켜져 있는 환경에서, 1인 사용자(피터)가 웹앱(`https://daily-productivity-wine.vercel.app/`)과 Slack(Hermes Agent) 양쪽에서 수동 로그인 마찰 없이 즉시 할 일을 읽고 쓸 수 있도록 **단일 워크스페이스 자동 세션(`peter.workspace@daily-productivity.app`)**과 **Node.js 기반 Stdio MCP 서버(`scripts/hermes-mcp-server.mjs`)**를 채택했다.

## Considered Options

- **옵션 1: 콘솔 수동 이메일/비밀번호 로그인 + Windows 파일 ACL 잠금 (`hermes-login.cmd` + `hermes-auth.mjs`)**
  - 기각 사유: 사용자가 수동으로 콘솔 창을 열어 로그인해야 하며, 에이전트 샌드박스 및 하위 프로세스에서 Windows ACL/PowerShell `EPERM` 오류가 발생해 실사용이 차단됨.
- **옵션 2: Supabase Google OAuth 활성화 및 브라우저 토큰 수동 추출**
  - 기각 사유: Google Cloud Console 설정이 추가로 필요하고 토큰 만료 시 재수출이 번거로움.
- **옵션 3 (채택): 단일 워크스페이스 자동 세션 + Stdio MCP 서버**
  - 선택 사유: 웹앱(`lib/auth-context.tsx`)과 MCP 서버(`scripts/hermes-mcp-server.mjs`)가 동일한 워크스페이스 계정으로 자동 인증하므로 로그인 창이나 수동 토큰 관리 없이 웹과 Slack이 즉시 100% 동기화됨.

## Consequences

- 어떤 기기나 브라우저에서 웹앱을 열어도 로그인 화면 없이 즉시 동일한 할 일 보드가 표시된다.
- Hermes Agent(Slack 이실장)와 Antigravity는 `mcp_daily_productivity_*` 도구를 통해 할 일과 하위 체크리스트(`subtasks`)를 직접 조회·생성·수정·완료·삭제할 수 있다.
- 기존 브라우저에 다른 이메일 세션이 남아 있더라도 자동으로 워크스페이스 세션으로 통일된다.
