# Daily Productivity

개인의 일일 업무(Work)와 개인(Personal) 할 일, 루틴, 프로젝트를 웹 대시보드와 메신저 에이전트(Hermes Slack)에서 단일 워크스페이스로 관리하는 생산성 컨텍스트.

## Language

**Todo (할 일)**:
사용자가 수행해야 하는 단일 과업 단위. 제목(`title`), 우선순위(`priority`), 마감일(`due_date`), 메모(`memo`), 분류(`clip`), 칸반 상태(`kanban_status`), 하위 체크리스트(`subtasks`)를 가진다.
_Avoid_: Task, Ticket, Issue

**Subtask (하위 체크리스트)**:
하나의 Todo 안에 속하는 세부 실행 단계 목록. 모든 Subtask가 완료되면 부모 Todo도 자동으로 완료(`done`) 상태로 전환된다.
_Avoid_: Child task, Sub-issue, Checklist item

**Clip (분류 탭)**:
Todo가 속하는 최상위 영역 구분으로, 회사 업무(`work`)와 개인 일정(`personal`) 두 가지 값만 가진다.
_Avoid_: Category, Folder, Workspace

**Kanban Status (칸반 상태)**:
할 일의 진행 단계를 나타내는 상태로, `backlog`(대기), `inprogress`(진행 중), `done`(완료), `hold`(보류) 네 가지 값만 가진다.
_Avoid_: Stage, Column, Phase

**Workspace Session (워크스페이스 자동 세션)**:
별도의 수동 로그인 절차 없이 웹 브라우저와 로컬 MCP 서버가 동일한 사용자의 데이터를 읽고 쓰기 위해 공유하는 단일 인증 세션.
_Avoid_: Guest session, Anonymous login
