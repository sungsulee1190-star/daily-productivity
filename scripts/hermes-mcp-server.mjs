#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { parseEnv } from 'node:util'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const WORKSPACE_AUTO_EMAIL =
  process.env.NEXT_PUBLIC_WORKSPACE_EMAIL || 'peter.workspace@daily-productivity.app'
const WORKSPACE_AUTO_PASSWORD =
  process.env.NEXT_PUBLIC_WORKSPACE_KEY || 'HansolDaily!2026#PeterWorkspace'

const COLUMNS =
  'id,user_id,title,completed,priority,due_date,memo,tags,clip,completed_at,subtasks,kanban_status,created_at,updated_at'

function loadSupabaseConfig() {
  let env = {}
  try {
    env = parseEnv(readFileSync(resolve(root, '.env.local'), 'utf8'))
  } catch {
    // fallback to process.env
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  }
  return { url, key }
}

let cachedSession = null
let cachedClient = null

async function getAuthenticatedClient() {
  const { url, key } = loadSupabaseConfig()
  const baseOptions = {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init = {}) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  }

  if (cachedSession && cachedClient) {
    try {
      const payload = JSON.parse(Buffer.from(cachedSession.access_token.split('.')[1], 'base64url').toString())
      if (payload.exp * 1000 > Date.now() + 60000) {
        return { client: cachedClient, userId: cachedSession.user.id }
      }
    } catch {
      // re-authenticate below
    }
  }

  const authClient = createClient(url, key, baseOptions)
  let { data, error } = await authClient.auth.signInWithPassword({
    email: WORKSPACE_AUTO_EMAIL,
    password: WORKSPACE_AUTO_PASSWORD,
  })

  if (error || !data?.session) {
    const signUpRes = await authClient.auth.signUp({
      email: WORKSPACE_AUTO_EMAIL,
      password: WORKSPACE_AUTO_PASSWORD,
    })
    if (signUpRes.error || !signUpRes.data?.session) {
      throw new Error(`Workspace authentication failed: ${signUpRes.error?.message || error?.message || 'unknown'}`)
    }
    data = signUpRes.data
  }

  cachedSession = data.session
  cachedClient = createClient(url, key, {
    ...baseOptions,
    global: {
      ...baseOptions.global,
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    },
  })

  return { client: cachedClient, userId: data.session.user.id }
}

function normalizeSubtasks(subtasks) {
  if (!Array.isArray(subtasks)) return []
  return subtasks
    .map((item) => {
      if (typeof item === 'string' && item.trim()) {
        return {
          id: randomUUID(),
          title: item.trim(),
          completed: false,
        }
      }
      if (item && typeof item === 'object' && typeof item.title === 'string' && item.title.trim()) {
        const normalized = {
          id: typeof item.id === 'string' && item.id ? item.id : randomUUID(),
          title: item.title.trim(),
          completed: Boolean(item.completed),
        }
        if (item.startDate) normalized.startDate = String(item.startDate)
        if (item.dueDate) normalized.dueDate = String(item.dueDate)
        if (item.completedAt) normalized.completedAt = String(item.completedAt)
        return normalized
      }
      return null
    })
    .filter(Boolean)
}

const TOOLS = [
  {
    name: 'list_todos',
    description:
      'Daily Productivity 웹앱(https://daily-productivity-wine.vercel.app/)의 할 일(Todo) 목록을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        clip: {
          type: 'string',
          enum: ['work', 'personal', 'all'],
          description: '업무(work), 개인(personal), 또는 전체(all, 기본값)',
        },
        completed: {
          type: 'boolean',
          description: '완료 여부 필터 (생략 시 전체 조회)',
        },
        kanban_status: {
          type: 'string',
          enum: ['backlog', 'inprogress', 'done', 'hold'],
          description: '칸반 보드 상태 필터',
        },
        search: {
          type: 'string',
          description: '제목이나 메모에 포함된 검색어',
        },
      },
    },
  },
  {
    name: 'get_todo',
    description: '특정 할 일(Todo)의 상세 정보와 하위 체크리스트(subtasks)를 ID로 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '할 일 UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_todo',
    description:
      'Daily Productivity 사이트에 새 할 일(Todo)을 정리해서 추가합니다. 하위 체크리스트(subtasks), 마감일(due_date), 우선순위(priority), 메모(memo)를 한 번에 넣을 수 있습니다.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '할 일 핵심 제목 (필수)' },
        memo: { type: 'string', description: '상세 메모 또는 배경 설명' },
        priority: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: '우선순위 (기본값: medium)',
        },
        due_date: {
          type: 'string',
          description: '마감일 (YYYY-MM-DD 형식, 없으면 생략)',
        },
        clip: {
          type: 'string',
          enum: ['work', 'personal'],
          description: '분류: 업무(work, 기본값) 또는 개인(personal)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '태그 배열 (예: ["영업", "CHP"])',
        },
        subtasks: {
          type: 'array',
          description: '하위 실행 체크리스트 (문자열 배열 또는 {title, completed, dueDate} 객체 배열)',
          items: {
            anyOf: [
              { type: 'string' },
              {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  completed: { type: 'boolean' },
                  dueDate: { type: 'string' },
                },
                required: ['title'],
              },
            ],
          },
        },
        kanban_status: {
          type: 'string',
          enum: ['backlog', 'inprogress', 'done', 'hold'],
          description: '칸반 상태 (기본값: backlog)',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_todo',
    description: '기존 할 일(Todo)의 제목, 메모, 마감일, 우선순위, 상태, 하위 체크리스트 등을 수정합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '수정할 할 일의 UUID (필수)' },
        title: { type: 'string', description: '새 제목' },
        memo: { type: 'string', description: '새 메모' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
        due_date: { type: ['string', 'null'], description: '마감일 (YYYY-MM-DD 또는 null)' },
        clip: { type: 'string', enum: ['work', 'personal'] },
        tags: { type: 'array', items: { type: 'string' } },
        completed: { type: 'boolean' },
        kanban_status: { type: 'string', enum: ['backlog', 'inprogress', 'done', 'hold'] },
        subtasks: {
          type: 'array',
          items: {
            anyOf: [
              { type: 'string' },
              {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  completed: { type: 'boolean' },
                  dueDate: { type: 'string' },
                },
                required: ['title'],
              },
            ],
          },
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'complete_todo',
    description: '할 일을 완료(done) 또는 미완료로 상태 변경합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '할 일 UUID (필수)' },
        completed: { type: 'boolean', description: '완료 여부 (기본값: true)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_todo',
    description: '할 일을 삭제합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '삭제할 할 일 UUID (필수)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_subtask',
    description: '기존 할 일에 하위 체크리스트(subtask) 항목 1개를 추가합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        todo_id: { type: 'string', description: '부모 할 일 UUID (필수)' },
        title: { type: 'string', description: '하위 체크리스트 내용 (필수)' },
        due_date: { type: 'string', description: '마감일 (YYYY-MM-DD, 선택)' },
      },
      required: ['todo_id', 'title'],
    },
  },
  {
    name: 'toggle_subtask',
    description: '기존 할 일의 하위 체크리스트(subtask) 완료 상태를 변경합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        todo_id: { type: 'string', description: '부모 할 일 UUID (필수)' },
        subtask_id: { type: 'string', description: '하위 체크리스트 UUID (필수)' },
        completed: { type: 'boolean', description: '지정 시 해당 상태로 설정, 생략 시 반전(toggle)' },
      },
      required: ['todo_id', 'subtask_id'],
    },
  },
]

async function handleToolCall(name, args = {}) {
  const { client, userId } = await getAuthenticatedClient()

  if (name === 'list_todos') {
    let query = client
      .from('todos')
      .select(COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (args.clip && args.clip !== 'all') {
      query = query.eq('clip', args.clip)
    }
    if (typeof args.completed === 'boolean') {
      query = query.eq('completed', args.completed)
    }
    if (args.kanban_status) {
      query = query.eq('kanban_status', args.kanban_status)
    }

    const { data, error } = await query
    if (error) throw new Error(`DB 조회 실패: ${error.message}`)

    let todos = data || []
    if (args.search && typeof args.search === 'string') {
      const q = args.search.toLowerCase()
      todos = todos.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.memo && t.memo.toLowerCase().includes(q))
      )
    }

    return { count: todos.length, todos }
  }

  if (name === 'get_todo') {
    const { data, error } = await client
      .from('todos')
      .select(COLUMNS)
      .eq('user_id', userId)
      .eq('id', args.id)
      .single()
    if (error || !data) throw new Error(`할 일을 찾을 수 없습니다 (${args.id})`)
    return data
  }

  if (name === 'add_todo') {
    if (!args.title || typeof args.title !== 'string' || !args.title.trim()) {
      throw new Error('title(제목)은 필수입니다.')
    }
    const now = new Date().toISOString()
    const payload = {
      id: randomUUID(),
      user_id: userId,
      title: args.title.trim(),
      memo: args.memo ?? null,
      priority: ['high', 'medium', 'low'].includes(args.priority) ? args.priority : 'medium',
      due_date: args.due_date ?? null,
      clip: ['work', 'personal'].includes(args.clip) ? args.clip : 'work',
      tags: Array.isArray(args.tags) ? args.tags.map(String) : [],
      subtasks: normalizeSubtasks(args.subtasks),
      completed: false,
      completed_at: null,
      kanban_status: ['backlog', 'inprogress', 'done', 'hold'].includes(args.kanban_status)
        ? args.kanban_status
        : 'backlog',
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await client.from('todos').insert(payload).select(COLUMNS).single()
    if (error) throw new Error(`할 일 추가 실패: ${error.message}`)
    return { status: 'created', todo: data }
  }

  if (name === 'update_todo') {
    if (!args.id) throw new Error('id는 필수입니다.')
    const patch = { updated_at: new Date().toISOString() }
    if (typeof args.title === 'string' && args.title.trim()) patch.title = args.title.trim()
    if (args.memo !== undefined) patch.memo = args.memo
    if (['high', 'medium', 'low'].includes(args.priority)) patch.priority = args.priority
    if (args.due_date !== undefined) patch.due_date = args.due_date
    if (['work', 'personal'].includes(args.clip)) patch.clip = args.clip
    if (Array.isArray(args.tags)) patch.tags = args.tags.map(String)
    if (Array.isArray(args.subtasks)) patch.subtasks = normalizeSubtasks(args.subtasks)
    if (['backlog', 'inprogress', 'done', 'hold'].includes(args.kanban_status)) {
      patch.kanban_status = args.kanban_status
    }
    if (typeof args.completed === 'boolean') {
      patch.completed = args.completed
      patch.completed_at = args.completed ? new Date().toISOString() : null
      if (args.completed && !args.kanban_status) patch.kanban_status = 'done'
    }

    const { data, error } = await client
      .from('todos')
      .update(patch)
      .eq('user_id', userId)
      .eq('id', args.id)
      .select(COLUMNS)
      .single()
    if (error) throw new Error(`할 일 수정 실패: ${error.message}`)
    return { status: 'updated', todo: data }
  }

  if (name === 'complete_todo') {
    const completed = args.completed !== undefined ? Boolean(args.completed) : true
    const now = new Date().toISOString()
    const patch = {
      completed,
      completed_at: completed ? now : null,
      kanban_status: completed ? 'done' : 'backlog',
      updated_at: now,
    }
    const { data, error } = await client
      .from('todos')
      .update(patch)
      .eq('user_id', userId)
      .eq('id', args.id)
      .select(COLUMNS)
      .single()
    if (error) throw new Error(`완료 상태 변경 실패: ${error.message}`)
    return { status: completed ? 'completed' : 'uncompleted', todo: data }
  }

  if (name === 'delete_todo') {
    const { error } = await client.from('todos').delete().eq('user_id', userId).eq('id', args.id)
    if (error) throw new Error(`삭제 실패: ${error.message}`)
    return { status: 'deleted', id: args.id }
  }

  if (name === 'add_subtask') {
    const { data: current, error: getErr } = await client
      .from('todos')
      .select(COLUMNS)
      .eq('user_id', userId)
      .eq('id', args.todo_id)
      .single()
    if (getErr || !current) throw new Error(`부모 할 일을 찾을 수 없습니다 (${args.todo_id})`)

    const existing = Array.isArray(current.subtasks) ? current.subtasks : []
    const newSubtask = {
      id: randomUUID(),
      title: String(args.title).trim(),
      completed: false,
      ...(args.due_date ? { dueDate: String(args.due_date) } : {}),
    }
    const subtasks = [...existing, newSubtask]
    const { data, error } = await client
      .from('todos')
      .update({ subtasks, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('id', args.todo_id)
      .select(COLUMNS)
      .single()
    if (error) throw new Error(`하위 체크리스트 추가 실패: ${error.message}`)
    return { status: 'subtask_added', subtask: newSubtask, todo: data }
  }

  if (name === 'toggle_subtask') {
    const { data: current, error: getErr } = await client
      .from('todos')
      .select(COLUMNS)
      .eq('user_id', userId)
      .eq('id', args.todo_id)
      .single()
    if (getErr || !current) throw new Error(`부모 할 일을 찾을 수 없습니다 (${args.todo_id})`)

    const existing = Array.isArray(current.subtasks) ? current.subtasks : []
    let found = false
    const subtasks = existing.map((s) => {
      if (s.id !== args.subtask_id) return s
      found = true
      const nextCompleted =
        typeof args.completed === 'boolean' ? args.completed : !s.completed
      return {
        ...s,
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date().toISOString() : undefined,
      }
    })
    if (!found) throw new Error(`하위 체크리스트를 찾을 수 없습니다 (${args.subtask_id})`)

    const allDone = subtasks.length > 0 && subtasks.every((s) => s.completed)
    const now = new Date().toISOString()
    const patch = {
      subtasks,
      completed: allDone ? true : current.completed,
      completed_at: allDone && !current.completed ? now : current.completed_at,
      kanban_status: allDone ? 'done' : current.kanban_status,
      updated_at: now,
    }

    const { data, error } = await client
      .from('todos')
      .update(patch)
      .eq('user_id', userId)
      .eq('id', args.todo_id)
      .select(COLUMNS)
      .single()
    if (error) throw new Error(`하위 체크리스트 변경 실패: ${error.message}`)
    return { status: 'subtask_toggled', todo: data }
  }

  throw new Error(`알 수 없는 도구입니다: ${name}`)
}

let useContentLength = false

function sendMessage(msg) {
  const json = JSON.stringify(msg)
  if (useContentLength) {
    const byteLength = Buffer.byteLength(json, 'utf8')
    process.stdout.write(`Content-Length: ${byteLength}\r\n\r\n${json}`)
  } else {
    process.stdout.write(`${json}\n`)
  }
}

async function handleRpcMessage(msg) {
  if (!msg || typeof msg !== 'object') return

  // Notifications have no id
  if (msg.id === undefined || msg.id === null) {
    return
  }

  const { id, method, params } = msg

  try {
    if (method === 'initialize') {
      const clientVersion = params?.protocolVersion || '2024-11-05'
      sendMessage({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: clientVersion,
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'daily-productivity-mcp',
            version: '1.0.0',
          },
        },
      })
      return
    }

    if (method === 'ping') {
      sendMessage({ jsonrpc: '2.0', id, result: {} })
      return
    }

    if (method === 'tools/list') {
      sendMessage({
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS },
      })
      return
    }

    if (method === 'tools/call') {
      const toolName = params?.name
      const toolArgs = params?.arguments || {}
      try {
        const output = await handleToolCall(toolName, toolArgs)
        sendMessage({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(output, null, 2),
              },
            ],
            isError: false,
          },
        })
      } catch (toolError) {
        sendMessage({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { error: toolError instanceof Error ? toolError.message : String(toolError) },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          },
        })
      }
      return
    }

    if (method === 'resources/list') {
      sendMessage({ jsonrpc: '2.0', id, result: { resources: [] } })
      return
    }

    if (method === 'prompts/list') {
      sendMessage({ jsonrpc: '2.0', id, result: { prompts: [] } })
      return
    }

    sendMessage({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    })
  } catch (err) {
    sendMessage({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: err instanceof Error ? err.message : 'Internal error',
      },
    })
  }
}

let rawBuffer = Buffer.alloc(0)
let rpcQueue = Promise.resolve()
let pendingRpcCount = 0
let stdinEnded = false

function checkExit() {
  if (stdinEnded && pendingRpcCount === 0) {
    process.exit(0)
  }
}

function dispatchRpc(msg) {
  pendingRpcCount++
  rpcQueue = rpcQueue
    .then(() => handleRpcMessage(msg))
    .catch(() => {})
    .finally(() => {
      pendingRpcCount--
      checkExit()
    })
}

process.stdin.on('data', (chunk) => {
  rawBuffer = Buffer.concat([rawBuffer, chunk])

  while (rawBuffer.length > 0) {
    const preview = rawBuffer.slice(0, 64).toString('utf8')
    if (preview.startsWith('Content-Length:')) {
      useContentLength = true
      const headerEnd = rawBuffer.indexOf('\r\n\r\n')
      if (headerEnd === -1) break
      const headerStr = rawBuffer.slice(0, headerEnd).toString('utf8')
      const match = headerStr.match(/Content-Length:\s*(\d+)/i)
      if (!match) {
        rawBuffer = rawBuffer.slice(headerEnd + 4)
        continue
      }
      const len = Number.parseInt(match[1], 10)
      const totalLen = headerEnd + 4 + len
      if (rawBuffer.length < totalLen) break
      const bodyStr = rawBuffer.slice(headerEnd + 4, totalLen).toString('utf8')
      rawBuffer = rawBuffer.slice(totalLen)
      try {
        dispatchRpc(JSON.parse(bodyStr))
      } catch {
        // ignore malformed json
      }
    } else {
      const nlIdx = rawBuffer.indexOf('\n')
      if (nlIdx === -1) break
      const lineStr = rawBuffer.slice(0, nlIdx).toString('utf8').trim()
      rawBuffer = rawBuffer.slice(nlIdx + 1)
      if (!lineStr) continue
      try {
        dispatchRpc(JSON.parse(lineStr))
      } catch {
        // ignore malformed json
      }
    }
  }
})

process.stdin.on('end', () => {
  stdinEnded = true
  checkExit()
})
