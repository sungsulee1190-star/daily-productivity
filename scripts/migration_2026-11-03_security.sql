-- 2026-11-03 보안 강화 — Supabase SQL Editor에서 직접 실행 필요 (아직 미적용)
-- app_state: 앱에서 사용하지 않는 레거시 단일 행 테이블. RLS를 켜서 anon 키로의 읽기/쓰기 차단 (데이터는 보존)
alter table public.app_state enable row level security;
-- Supabase advisor 0011: 트리거 함수 search_path 고정
alter function public.update_updated_at() set search_path = '';
