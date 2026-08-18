import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const todoStore = read('store/todoStore.ts')
const todoItem = read('components/TodoItem.tsx')
const dailyPage = read('app/todo/daily/page.tsx')
const allTodosPage = read('app/todo/all/page.tsx')
const routinePage = read('app/routine/page.tsx')
const databaseTypes = read('lib/database.types.ts')
const migration = read('scripts/migration_add_todo_extended_fields.sql')

assert.match(todoStore, /updateSubtask:/, 'todo store exposes updateSubtask')
assert.match(todoStore, /memo:\s*todo\.memo/, 'todo sync persists memo to Supabase')
assert.match(todoStore, /tags:\s*todo\.tags/, 'todo sync persists tags to Supabase')
assert.match(todoStore, /subtasks:\s*todo\.subtasks/, 'todo sync persists subtasks to Supabase')
assert.match(todoStore, /clip:\s*todo\.clip/, 'todo sync persists clip to Supabase')
assert.match(todoStore, /kanban_status:\s*todo\.kanbanStatus/, 'todo sync persists kanban status to Supabase')
assert.match(todoStore, /row\.subtasks/, 'todo fetch restores subtasks from Supabase')
assert.match(todoStore, /row\.tags/, 'todo fetch restores tags from Supabase')

assert.match(databaseTypes, /subtasks:\s*Json/, 'database type includes todos.subtasks')
assert.match(databaseTypes, /tags:\s*string\[\]/, 'database type includes todos.tags')
assert.match(databaseTypes, /kanban_status:/, 'database type includes todos.kanban_status')

assert.match(todoItem, /editingSubtaskId/, 'TodoItem supports editing an existing subtask')
assert.match(todoItem, /updateSubtask\(todo\.id,\s*subtaskId/, 'TodoItem saves edited subtask text')
assert.match(todoItem, /sub\.completed \? 'var\(--text-muted\)' : 'var\(--text-primary\)'/, 'active subtask text is primary black text')

assert.match(dailyPage, /tagFilter/, 'daily page has tag filter state')
assert.match(dailyPage, /availableTags/, 'daily page exposes available tags')
assert.match(dailyPage, /todo\.tags\.some/, 'daily page can filter by tags')
assert.match(allTodosPage, /t\.tags\.some/, 'all todos search includes tags')

assert.match(routinePage, /fetchRoutines/, 'routine page fetches routines from Supabase')
assert.match(routinePage, /syncRoutineToSupabase/, 'routine page syncs routine changes to Supabase')
assert.match(databaseTypes, /routines:/, 'database type includes routines table')
assert.match(migration, /create table if not exists public\.routines/, 'migration creates routines table')

console.log('todo feature static checks passed')
