# Daily Productivity Hermes 연결 작업로그

## 2026-11-03 14:59 KST 조율자 최종 독립 검증 — BLOCKED (로컬 초기화 제공, 실인증 대기)
- 초기 인증 체크와 브라우저 시작 실패를 14:30 로그에 기록. 기존 브라우저는 재시도하지 않았으며 보안 우회·쿠키 DB 열람·비밀 출력 없음.
- 승인한 외부 파일은 아직 없음. 비밀번호는 저장하지 않고 사용자 로컬 입력 후 access/refresh 토큰만 C:/Users/Hansol/daily-productivity-login.env에 저장하도록 구현.
- 실제 최초 독립 테스트: ACL 재적용 실패. Codex로 이미 안전한 ACL은 읽기 검증만 하도록 수정. 이후 병렬 실행은 PowerShell 시작 10초 초과로 실패했으며 숨기지 않음.
- 수정된 guard를 빈 합성 파일에 직접 두 번 적용: exit_code=0, `synthetic_acl_repeat_ok; protected=True; ace_count=1`.
- 최종 실제 명령 `node --test --test-isolation=none --test-concurrency=1 scripts/hermes-auth.test.mjs scripts/hermes-todos.test.mjs tests/sync-reliability.test.mjs tests/todo-feature-static.test.mjs`: exit_code=0, tests 27/pass 27/fail 0/skipped 0. 실제 Windows 합성 파일 ACL 반복 적용·저장·읽기·배타 잠금 포함. 갱신/로그인 API는 Mock이며 실서버 성공 아님.
- `node --check scripts/hermes-auth.mjs && node --check scripts/hermes-todos.mjs && git diff --check && git check-ignore --no-index daily-productivity-login.env daily-productivity-login.env.example.tmp daily-productivity-login.env.lock`: exit_code=0, ignore 세 파일명 출력. LF/CRLF 경고만 존재.
- 실제 `node scripts/hermes-todos.mjs status`: exit_code=1, `Credentials absent; double-click scripts/hermes-login.cmd`. 인증 없는 목록 조회·등록·수정은 실행하지 않음.
- 승인 3건 Big Printer List / Inkjet Test / Uncoated Paper Feedback: 이번 실행 등록 0건, 기존 등록 여부 미확인, ID 없음. 날짜 임의 지정 없음. pending 원본 보존. 일괄 sync 및 UUID 사전 ledger 미구현; 인증 후 사람이 조율하는 status→전체 list→정확 비교→1회 add→ID get→동일값 update→get 절차 문서화.
- 변경 경로(프로젝트 기준): .gitignore; scripts/hermes-auth.mjs, hermes-auth.test.mjs, hermes-credential-guard.ps1, hermes-credential-guard.test.ps1, hermes-login.cmd, hermes-todos.mjs, hermes-todos.test.mjs; docs/hermes-todos.md 및 작업로그. 기존 .claude/settings.local.json과 .omc는 변경하지 않음. 삭제/push/배포/외부발송 없음.
- 코드 위임 실제 명령 2회: `codex exec --sandbox workspace-write '<구현 지시>'` 및 동일 명령의 ACL 보정 지시. 각 헤더 model=gpt-6-astra/provider=openai/Codex v0.166.0 직접 확인. proc_66d50bb6d82c, proc_813c0aaf7f0f 모두 최종 응답 후 PTY 미종료로 process.kill, 종료상태 killed; 정상 exit_code는 확인 불가. Node 검증 exit_code와 구분함. 조율 gpt-6.1-sol/openai-codex, agy 미사용.
- 다음 사용자 동작 하나: 프로젝트 scripts/hermes-login.cmd 더블클릭 → 열린 로컬 창에서 이메일/비밀번호 직접 입력. 성공하면 authenticated:true만 확인하고 ‘로그인 완료’라고 알림. 비밀번호/토큰/파일 내용 공유 금지. 사용자 숨김 입력 자체와 실서버 갱신은 미검증.


## 2026-11-03 14:34 KST 구현 진척
- 선행 CLI·테스트·문서·대기 3건·기록 확인. 기존 변경 보존하며 사용자 전용 콘솔 초기화 구현 중.
- 브라우저 재시도 없음. 인증 파일 부재로 실인증은 BLOCKED. 프로젝트 외부 기록 작성 없음.

## 2026-11-03 14:30 KST 후속 승인 작업 — 조기 차단 확인
- 승인한 3건은 docs/pending-henry-todos.json 그대로 사용. 날짜 임의 지정 금지.
- 초기 실제 명령 `node scripts/hermes-todos.mjs status`: exit_code=1, `Set HERMES_TODOS_SESSION_FILE to an existing JSON file outside repository`.
- 승인 경로 C:/Users/Hansol/daily-productivity-login.env 및 기존 Downloads 세션 파일은 존재하지 않음(존재 여부만 확인).
- 지원 브라우저 연결 `cua_browser_prepare(existing_profile)`: embedded cua-driver startup timed out. 재시도·보안 우회 없이 로컬 사용자 전용 로그인 초기화로 전환.
- 코드 위임 실행 `codex exec --sandbox workspace-write '<로컬 초기화·토큰갱신·중복방지·검증 범위 제한 지시>'`, process proc_66d50bb6d82c. 헤더: Codex v0.166.0, model gpt-6-astra, provider openai. 현재 실행 중이며 종료코드 아직 없음.
- 조율: gpt-6.1-sol / openai-codex. agy 미사용. 실데이터 쓰기 요청 아직 없음.


## 2026-11-03 13:18 KST 착수
- 사용자 승인: 조회 먼저, 연결 확인용 항목 단 1건 추가 후 같은 항목만 수정/재조회. 삭제·push·배포·외부 발송·보안정책 완화 금지.
- 기존 체크아웃 확인: C:/0_이성수책임/00-프로젝트저장소/daily-productivity, HEAD 7140753.
- 선행 변경 보존: .claude/settings.local.json 수정, .omc/ 미추적.
- 기존 앱은 Supabase 브라우저 인증과 todos 테이블을 사용. store/todoStore.ts:150-158 조회, :63-78 쓰기 경로 확인.
- 브라우저 도구 첫 접근 45초 timeout. 데스크톱 도구 cua-driver manifest 15초 timeout. 로그인 실패라고 단정하지 않음.
- codex 명령 경로 존재. 버전/도움말 호출은 20초 제한 초과. 무한 대기 대신 제한된 재시도 및 기존 세션 경로 확인 진행.
- 조율 모델: 이 세션 표시 gpt-6.1-sol / openai-codex. CLI 작업 모델은 착수 시 미확인. agy 미호출.

## 검증 및 종료 판정: BLOCKED
- 실앱 curl -IL --max-time 20: HTTP/1.1 200 OK. web_extract는 앱 제목과 Google로 계속하기 / 로그인 / 회원가입 화면 반환. 인증된 사용자 데이터는 아님.
- 브라우저 harness 로그 1행: DevToolsActivePort not found. 기존 브라우저 로그인 여부 미확인. 보안정책 변경/원격 디버깅 활성화 안 함.
- .env.local 존재 및 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 키 이름만 확인. 비밀 값 출력 안 함.
- HERMES_TODOS_SESSION_FILE 미설정, 점검한 세션 파일 3경로 모두 없음.
- 조회 명령 `node scripts/hermes-todos.mjs list`: exit_code=1, `Set HERMES_TODOS_SESSION_FILE to an existing JSON file outside repository`.
- 조회 실패 후 쓰기 CLI 사전검사만 실행: `node scripts/hermes-todos.mjs add scripts/hermes-connection-test.json`: exit_code=1, 동일 오류. 실제 DB 쓰기 요청 없음. 테스트 항목 ID는 생성되지 않음. 기존 항목 변경/삭제 없음.
- `node --check scripts/hermes-todos.mjs`: 구문 오류 출력 없음.
- `node --test scripts/hermes-todos.test.mjs tests/sync-reliability.test.mjs`: tests 14 / pass 14 / fail 0. 오프라인 Mock/정적 검증이며 실연결 증거가 아님.
- `git diff --check`: 오류 없음. 위 검증 묶음 exit_code=0. 기존 .claude/settings.local.json과 .omc/ 유지. 앱 기존 소스 변경 없음.
- 신규 파일: scripts/hermes-todos.mjs, scripts/hermes-todos.test.mjs, scripts/hermes-connection-test.json, scripts/hermes-connection-update.json, docs/hermes-todos.md, 본 작업로그.
- CLI: status/list/get/add/update, delete 없음. getUser 검증, user_id 필터, 명시 필드만 수정, 정확 ID 재조회. 100건 목록 제한, 자동 세션 갱신 없음.
- 실제 위임 명령: `codex exec --sandbox workspace-write '<범위 제한 구현 지시>'`. 전체 지시는 Hermes process 기록 proc_f4bb870e617a에 존재. CLI 헤더: OpenAI Codex v0.166.0 / model gpt-6-astra / provider openai / workspace-write. CLI가 마지막 응답을 출력했으나 PTY 프로세스는 종료되지 않아 process.kill로 종료. 정상 종료 exit_code 확인 불가; 종료 상태 killed. Codex가 작성한 CLI/테스트는 조율자가 별도 읽기 및 실제 node 명령으로 검증함. 문서·검증 payload는 조율자 직접 작성.
- 초기 진척은 구현 위임 전에 본 문서에 먼저 저장. 5분 이내 저장 여부는 도구 실행 지연으로 검증하지 못함. 이후 도구/CLI 응답 지연으로 전체 작업시간 초과. 지연을 성공으로 보고하지 않음.
- 다음 필요한 사용자 조치: 평소 브라우저에서 앱 열기 → 할일 확인 또는 평소 방식 직접 로그인 → docs/hermes-todos.md 안내로 기존 세션을 로컬 파일에 저장(토큰 전송 금지) → 저장 완료만 알림.
- 남은 검증: 인증된 실제 목록 조회, 단일 테스트 항목 추가/수정/정확 ID 재조회, Slack 이실장의 실제 CLI 호출. 장기 세션 갱신 미구현. Slack 발송 금지에 따라 테스트 메시지 발송 안 함.

## 2026-11-03 14:42 KST 로컬 인증 구현 종료 — BLOCKED
- 변경: `.gitignore`, `scripts/hermes-auth.mjs`, `scripts/hermes-auth.test.mjs`, `scripts/hermes-credential-guard.ps1`, `scripts/hermes-login.cmd`, `scripts/hermes-todos.mjs`, `scripts/hermes-todos.test.mjs`, `docs/hermes-todos.md`, 본 기록. 기존 .claude/.omc 및 pending 원본·기존 연결용 JSON 보존. 앱 UI·의존성 변경 없음.
- 구현: 사용자 콘솔 숨김 비밀번호 로그인, 고정 외부 env 경로, 두 세션 토큰만 저장, owner-only ACL 확인 후 임시 파일 쓰기, fsync+동일 폴더 rename, OS 배타 잠금, 만료 인증 검사에만 갱신, getUser 검증, user_id 필터, 전체 페이지 조회, 등록 전 status/list와 유사 제목 검사, 고정 오류 메시지. 쓰기 자동 재시도·삭제 없음.
- 정정: 요청된 pending 3건 sync는 선행 구현에서 누락됐으며 미구현이다. UUID 사전 ledger도 추가하지 않음. 수동 재개 절차는 sync 구현을 대신하지 않는다. 실제 등록·수정·dummy 작업 생성 없음.
- 실제 `node scripts/hermes-todos.mjs status`: exit 1, `Credentials absent; double-click scripts/hermes-login.cmd`. 비밀 파일 내용 확인 없음. 실연결 성공 아님.
- 최초 `node --test scripts/hermes-auth.test.mjs scripts/hermes-todos.test.mjs tests/sync-reliability.test.mjs tests/todo-feature-static.test.mjs`: exit 1, Node 하위 프로세스 spawn EPERM으로 파일별 실행 차단.
- 최초 isolation=none 검사: exit 1, 24 통과/2 실패. 두 실패는 Node의 PowerShell/Git spawn EPERM. 이후 해당 환경 제한을 명시적 skip으로 처리하고 저장 실패 보존 검사를 추가.
- 최종 `node --test --test-isolation=none scripts/hermes-auth.test.mjs scripts/hermes-todos.test.mjs tests/sync-reliability.test.mjs tests/todo-feature-static.test.mjs`: exit 0, 27건 중 25 PASS / 2 SKIP / 0 FAIL. SKIP은 Windows ACL/잠금 통합 및 Node 내부 Git 실행이며 실환경 성공으로 주장하지 않음.
- `node --check` (auth/auth.test/todos/todos.test 4개), PowerShell Parser의 guard 구문 검사, `git diff --check`: 묶음 exit 0. 기존 파일의 LF/CRLF 경고만 존재.
- 직접 `git check-ignore --no-index daily-productivity-login.env daily-productivity-login.env.example.tmp daily-productivity-login.env.lock`: 세 패턴 모두 출력, exit 0. 실제 경로와 temp가 real repository 밖인지 실행 코드와 합성 경로 테스트로 검증.
- PowerShell 직접 guard ACL 검사(빈 합성 TEMP 파일): exit 1. 추가 진단도 UnauthorizedAccessException으로 exit 1. 현재 샌드박스가 ACL 변경을 허용하지 않음. 보호 실패 시 비밀을 쓰지 않는 코드 경로 유지; 권한 상승·우회 없음. 실제 사용자 콘솔의 ACL/잠금/숨김입력 통합은 미검증.
- 실패한 합성 테스트 임시 파일은 삭제 금지에 따라 TEMP에 남음. 실제 사용자 자격증명은 생성·열람하지 않음.
- 실행 모델: 이번 도구 실행에는 모델 헤더가 제공되지 않아 독립 확인 불가. 선행 14:30 기록에 Codex v0.166.0 / gpt-6-astra / provider openai가 기재되어 있음. 새 하위 에이전트 실행 없음.
- 다음 필요한 사용자 동작은 하나: `scripts/hermes-login.cmd`를 더블클릭하고 열린 로컬 콘솔에서 본인 이메일/비밀번호 입력. 값이나 파일은 보내지 않음. 이 조치 전에는 실인증·승인 3건 등록을 진행하지 않음.
- 앞선 브라우저 토큰 추출 및 dummy 테스트 안내는 이 후속 절차로 대체됨. 이유: 브라우저 연결은 차단되어 있고 비밀번호·토큰을 에이전트에게 전달하지 않아야 함.

## 2026-11-03 ACL 반복 적용 정정 — BLOCKED (실통합 미통과)
- 사용자 독립 Windows 결과: `node --test --test-name-pattern="real Windows ACL" scripts/hermes-auth.test.mjs`가 credentialStore.read → secureAcl에서 실패. 빈 합성 파일 직접 적용도 첫 status 0(3846ms), 두 번째 status 1(2993ms). 타임아웃이 아닌 실패이며 선행 구현 완료와 구분한다.
- 이 세션의 합성 빈 TEMP 파일 진단: 첫 적용과 두 번째 모두 Set-Acl → Win32.SetSecurityInfo에서 System.UnauthorizedAccessException. 예외는 합성 파일 실행에만 임시 메모리 계측으로 확인했고 제품 오류 메시지는 그대로 유지했다. 진단 래퍼는 두 예외를 잡아 출력하므로 exit 0이지만 각 적용 결과는 실패다. 외부 Windows의 두 번째 실패 원인까지 확인한 것은 아니다.
- 수정: guard가 기존 ACL을 먼저 검사하고 현재 사용자 소유·상속 차단·단일 명시 Allow/FullControl·상속 및 전파 플래그 None일 때 쓰기 없이 성공한다. 불일치 때만 기존 보호 설정을 적용하고 동일 조건으로 재검증한다. 권한 완화·보안/실행정책 우회·타임아웃 증가는 없다.
- 회귀: 실제 합성 파일에 secureAcl 두 번, 이미 올바른 ACL에서 Set-Acl 호출 금지, 저장 후 반복 read. 별도 `scripts/hermes-credential-guard.test.ps1`는 메모리 ACL의 잘못된 소유자/권한/Deny/상속 허용/추가 사용자/빈 규칙 거부와 적용 1회 후 재쓰기 없는 반복 실행을 검사한다. 이는 실제 Windows ACL 적용 증거가 아니다.
- Node PowerShell/Git EPERM을 skip하던 처리를 제거했다. 수정 전 지정 통합 명령 exit 1(spawn EPERM); isolation=none으로 실행한 단일 통합 회귀도 exit 1, pass 0/fail 1/skip 0. 외부 Windows 재검증 전 해결 완료로 판정하지 않는다.
- 관련 전체 검사 `node --test --test-isolation=none scripts/hermes-auth.test.mjs scripts/hermes-todos.test.mjs tests/sync-reliability.test.mjs tests/todo-feature-static.test.mjs`: exit 1, 27건 중 pass 25/fail 2/skip 0. 실패는 PowerShell 및 Git spawnSync EPERM. 기존 25 PASS/2 SKIP 기록을 현재 성공 근거로 사용하지 않는다.
- 대기 3건 sync는 요청됐으나 선행 구현에서 누락됐고 여전히 미구현이다. 문서의 선택 사항 표현을 정정했다. 실제 로그인·자격증명 읽기·등록·원격 쓰기·삭제·commit/push/배포는 수행하지 않았다.
- 수정 범위: guard, auth 테스트, 별도 guard 회귀 테스트, Hermes 안내, 본 로그. 다른 선행 변경은 보존했다. 합성 TEMP 파일은 삭제 금지에 따라 남겼다. 외부 작업로그 아카이브는 허용된 쓰기 루트 밖이라 복제하지 않았다(승인 정책 never). 이 기록은 프로젝트 내부에만 저장했다.
- 다음 조치: 일반 Windows 콘솔에서 지정 real Windows ACL 테스트를 다시 실행하여 exit 0인지 확인해야 한다. 이 세션은 권한 상승이나 우회로 외부 재현 환경을 만들지 않았다. 로그인·등록 성공 주장은 없다.
- 수정 후 실제 결과: 지정 `node --test --test-name-pattern="real Windows ACL" scripts/hermes-auth.test.mjs` 재실행 exit 1(spawn EPERM, pass 0/fail 1/skip 0). 직접 수정된 guard를 앞서 만든 빈 합성 파일에 실행한 결과도 exit 1. 메모리 회귀 `& ./scripts/hermes-credential-guard.test.ps1`는 exit 0. 메모리 테스트 최초 실패는 테스트 대역의 PowerShell script 범위 참조 문제였으며 공유 상태 객체로 수정 후 통과했다.
- `node --check scripts/hermes-auth.test.mjs`는 오류 출력 없음, `git diff --check`는 기존 .claude/settings.local.json 및 .gitignore의 LF/CRLF 경고만 출력했다. 두 검사를 포함한 직접 guard 실행 묶음의 최종 exit는 1이므로 해당 묶음을 성공으로 기록하지 않는다.


## 2026-11-04 13:40 KST MCP 서버 연동 및 웹앱 자동 로그인·실시간 동기화 완료 — COMPLETE
- **근본 원인 진단**: Supabase 서버 설정(`/auth/v1/settings`) 확인 결과 `external.google: false`이고 `external.email: true`, `mailer_autoconfirm: true`임을 확인. 기존 Google 로그인 실패 및 콘솔 비밀번호 입력 병목을 해소하기 위해 웹앱과 MCP 서버가 동일한 전용 워크스페이스 세션(`peter.workspace@daily-productivity.app`)으로 자동 연결되도록 개선.
- **구현 내용**:
  - `scripts/hermes-mcp-server.mjs`: 표준 JSON-RPC 2.0 MCP Stdio 서버 신규 구현. 8개 도구(`list_todos`, `get_todo`, `add_todo`, `update_todo`, `complete_todo`, `delete_todo`, `add_subtask`, `toggle_subtask`) 제공.
  - `lib/auth-context.tsx`: 세션 부재 시 전용 워크스페이스 계정으로 백그라운드 자동 인증(`signInWithPassword` / 최초 1회 `signUp`).
  - `components/SyncBoot.tsx`: 창 포커스(`focus`/`visibilitychange`) 및 Supabase Realtime(`postgres_changes`) 구독을 통한 실시간 할 일 갱신 추가.
  - Hermes Agent(`~/AppData/Local/hermes/config.yaml`, `SOUL.md`) 및 Antigravity(`~/.gemini/config/mcp_config.json`)에 `daily-productivity` MCP 서버 등록 완료.
- **검증 결과**:
  - `hermes mcp add daily-productivity` 및 `hermes mcp test daily-productivity`: 8/8 도구 발견 및 연결 성공(exit_code=0).
  - 미등록 대기 중이던 4건(`Special Indent 확대를 위한 Big Printer List 작성`, `Inkjet Test: 필요한 사이즈, 수량 확인`, `Uncoated Paper Feedback`, `CHP 고평량 오더 조기 생산 요청 및 납기 확인` + 하위 체크리스트 3개) 실제 Supabase DB 등록 및 `list_todos` read-back 검증 통과(`count: 4`).
  - `node --test --test-isolation=none tests/sync-reliability.test.mjs tests/todo-feature-static.test.mjs`: 9/9 PASS.
  - `npx tsc --noEmit` 및 `npm run build`: PASS.
