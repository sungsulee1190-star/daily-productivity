-- Migration: add project period columns to tracker_sessions
-- Run this in Supabase Dashboard > SQL Editor
alter table public.tracker_sessions
  add column if not exists start_date text,
  add column if not exists end_date text;
