'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import {
  FolderKanban, ClipboardList, FileBarChart2, Bug,
  Calendar, MessageSquare, Plus, ArrowRight,
  Newspaper, ExternalLink,
  ChevronRight, ChevronDown, ChevronUp, Clock,
  RefreshCw, CheckSquare, X, Briefcase, Building2
} from 'lucide-react'
import { supabase, type Project } from '@/lib/supabase'
import { getProjectGradient, cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import type { NewsArticle } from '@/app/api/news/route'
import { useTheme } from '@/components/ThemeProvider'

type Todo = { id: string; text: string; completed: boolean; date: string }

// ── Shift countdown ──────────────────────────────────────────
function useShiftCountdown() {
  const [text, setText] = useState('')
  const [pct, setPct] = useState(0)

  useEffect(() => {
    function calc() {
      const now = new Date()
      const start = new Date(now); start.setHours(11, 30, 0, 0)
      const end = new Date(now);   end.setHours(20, 30, 0, 0)
      const total = end.getTime() - start.getTime()

      if (now < start) {
        const diff = start.getTime() - now.getTime()
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        setText(`Shift starts in ${h}h ${m}m`)
        setPct(0)
      } else if (now > end) {
        setText('Shift over — great work today! 🎉')
        setPct(100)
      } else {
        const diff = end.getTime() - now.getTime()
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        setText(`${h}h ${m}m left in your shift`)
        setPct(Math.round(((now.getTime() - start.getTime()) / total) * 100))
      }
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [])

  return { text, pct }
}

// ── Greeting ─────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return { label: 'Good Night',    emoji: '🌙' }
  if (h < 8)  return { label: 'Good Sunrise',  emoji: '🌅' }
  if (h < 12) return { label: 'Good Morning',  emoji: '☀️' }
  if (h < 17) return { label: 'Good Afternoon',emoji: '🌤️' }
  if (h < 20) return { label: 'Good Evening',  emoji: '🌆' }
  return       { label: 'Good Night',           emoji: '🌙' }
}

// ── Mini stat card ────────────────────────────────────────────
interface StatProps {
  label: string; value: string | number; icon: React.ReactNode
  from: string; to: string; loading: boolean
}
function StatCard({ label, value, icon, from, to, loading }: StatProps) {
  return (
    <div className="card p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-indigo-500/15 dark:hover:shadow-[#00e676]/10 transition-all duration-200">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-md text-white shrink-0 bg-gradient-to-br', from, to)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">
          {loading
            ? <span className="inline-block w-8 h-6 bg-white/10 rounded animate-pulse" />
            : value}
        </p>
        <p className="text-xs font-semibold text-slate-400 dark:text-[#3d8a52] uppercase tracking-wide mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Project mini card ─────────────────────────────────────────
const STATUS_CHIP: Record<string, string> = {
  active:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  completed: 'bg-blue-500/20    text-blue-300    border-blue-500/30',
  paused:    'bg-amber-500/20   text-amber-300   border-amber-500/30',
  'on-hold': 'bg-amber-500/20   text-amber-300   border-amber-500/30',
  archived:  'bg-slate-500/20   text-slate-400   border-slate-500/30',
}
function ProjectMiniCard({ project }: { project: Project }) {
  const g = getProjectGradient(project.color)
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="card-hover p-4 group relative overflow-hidden">
        <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r rounded-t-2xl', g)} />
        <div className="flex items-start justify-between mb-3 pt-1">
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-base shadow', g)}>
            {project.name.charAt(0).toUpperCase()}
          </div>
          <span className={cn('badge text-[10px]', STATUS_CHIP[project.status] ?? STATUS_CHIP.active)}>
            {project.status}
          </span>
        </div>
        <h4 className="font-semibold text-white text-sm truncate mb-1">{project.name}</h4>
        <p className="text-xs text-slate-400 line-clamp-2 min-h-[2rem]">
          {project.description ?? 'No description.'}
        </p>
        <div className="flex items-center justify-end mt-3">
          <ExternalLink size={11} className="text-indigo-300/80 group-hover:text-indigo-600 dark:group-hover:text-[#00e676] transition-colors" />
        </div>
      </div>
    </Link>
  )
}

// ── News card accent gradients ────────────────────────────────
const CARD_ACCENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-fuchsia-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-cyan-600',
]

// ── News card ─────────────────────────────────────────────────
function NewsCard({ article, index }: { article: NewsArticle; index: number }) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
       className="group flex flex-col overflow-hidden rounded-2xl bg-white/72 dark:bg-[#071507] hover:bg-white/92 border border-white/88 dark:border-[#1e4a24] hover:border-indigo-200 dark:hover:border-[#00e676]/30 hover:shadow-xl hover:shadow-indigo-200/30 dark:hover:shadow-[#00e676]/10 hover:-translate-y-1 transition-all duration-300" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className={`h-1.5 bg-gradient-to-r ${accent} flex-shrink-0`} />
      {article.cover_image && (
        <div className="w-full h-36 overflow-hidden bg-slate-700 dark:bg-[#0c2a10]">
          <img src={article.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="flex-1 flex flex-col p-4 gap-2.5">
        {article.tag_list.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tag_list.slice(0, 3).map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100/80 text-indigo-700 dark:bg-violet-500/20 dark:text-violet-300 uppercase tracking-wide">
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm font-bold text-indigo-900 dark:text-white line-clamp-3 leading-snug group-hover:text-indigo-600 dark:group-hover:text-[#00e676] transition-colors flex-1">
          {article.title}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-indigo-100/60 dark:border-[#1e4a24]">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0`}>
              <span className="text-[9px] text-white font-black">{article.user.name.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-[10px] text-indigo-700 dark:text-slate-400 font-medium truncate max-w-[100px]">{article.user.name}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-indigo-400 dark:text-slate-500 flex-shrink-0">
            <Clock size={9} />
            <span>{article.reading_time_minutes}m read</span>
          </div>
        </div>
      </div>
    </a>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { dark } = useTheme()

  const [projects, setProjects] = useState<Project[]>([])
  const [testCaseCount, setTestCaseCount] = useState(0)
  const [reportCount, setReportCount] = useState(0)
  const [bugCount, setBugCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsExpanded, setNewsExpanded] = useState(false)
  const [todos, setTodos] = useState<Todo[]>([])
  const [showAddTodo, setShowAddTodo] = useState(false)
  const [newTodoText, setNewTodoText] = useState('')
  const [upcomingWFO, setUpcomingWFO] = useState<string[]>([])
  const { text: shiftText, pct: shiftPct } = useShiftCountdown()
  const greeting = getGreeting()

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todayTodos = todos.filter(t => t.date === todayKey)

  useEffect(() => {
    fetchDashboardData()
    fetchNews()
    const stored = localStorage.getItem('qa_portal_todos')
    if (stored) {
      try { setTodos(JSON.parse(stored)) } catch { /* ignore */ }
    }
    const storedWS = localStorage.getItem('qa_portal_work_status')
    if (storedWS) {
      try {
        const ws = JSON.parse(storedWS) as Record<string, string>
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const upcoming = Object.entries(ws)
          .filter(([dateKey, status]) => status === 'planned_wfo' && dateKey > todayStr)
          .map(([dateKey]) => dateKey)
          .sort()
        setUpcomingWFO(upcoming)
      } catch { /* ignore */ }
    }
  }, [])

  function saveTodosToStorage(updated: Todo[]) {
    setTodos(updated)
    localStorage.setItem('qa_portal_todos', JSON.stringify(updated))
  }

  function addTodo() {
    if (!newTodoText.trim()) return
    saveTodosToStorage([
      ...todos,
      { id: Date.now().toString(), text: newTodoText.trim(), completed: false, date: todayKey },
    ])
    setNewTodoText('')
    setShowAddTodo(false)
  }

  function toggleTodo(id: string) {
    saveTodosToStorage(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  function deleteTodo(id: string) {
    saveTodosToStorage(todos.filter(t => t.id !== id))
  }

  async function fetchDashboardData() {
    const [projectsRes, testCasesRes, reportsRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(6),
      supabase.from('test_cases').select('id', { count: 'exact' }),
      supabase.from('test_reports').select('id, bugs_found').order('created_at', { ascending: false }).limit(5),
    ])
    if (projectsRes.data) setProjects(projectsRes.data)
    if (testCasesRes.count !== null) setTestCaseCount(testCasesRes.count)
    if (reportsRes.data) {
      setReportCount(reportsRes.data.length)
      setBugCount(reportsRes.data.reduce((s: number, r: any) => s + (r.bugs_found ?? 0), 0))
    }
    setLoading(false)
  }

  async function fetchNews() {
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      setNews(data.articles ?? [])
    } catch { /* silent */ }
    setNewsLoading(false)
  }

  const visibleNews = newsExpanded ? news : news.slice(0, 3)

  // ── Banner theme values ──────────────────────────────────────
  const bannerBg = dark
    ? 'linear-gradient(135deg, #020c02 0%, #071f07 55%, #030f03 100%)'
    : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #3b82f6 100%)'

  const bannerShadow = dark ? 'shadow-[#00e676]/8' : 'shadow-indigo-500/30'

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6 max-w-[1400px]">

        {/* ── Welcome Banner ── */}
        <div
          className={`relative overflow-hidden rounded-2xl p-6 shadow-xl ${bannerShadow} ${dark ? 'ring-1 ring-[#1e4a24]' : ''}`}
          style={{ background: bannerBg }}
        >
          {/* Decorative blobs */}
          <div className={`absolute -bottom-6 -left-6 w-32 h-32 rounded-full blur-2xl pointer-events-none ${dark ? 'bg-[#00e676]/8' : 'bg-violet-400/20'}`} />
          <div className="absolute top-0 right-0 h-full opacity-20 pointer-events-none" style={{ width: '40%' }}>
            <div className={`absolute top-4 right-8 w-32 h-32 rounded-full blur-2xl ${dark ? 'bg-[#00e676]/15' : 'bg-white/50'}`} />
            <div className={`absolute bottom-4 right-24 w-16 h-16 rounded-full blur-xl ${dark ? 'bg-[#69ff47]/8' : 'bg-blue-300/30'}`} />
          </div>

          <div className="relative flex flex-col lg:flex-row items-start gap-6">

            {/* Left: greeting + shift */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{greeting.emoji}</span>
                <h2 className="text-xl font-bold text-white">{greeting.label}, Subhradeep!</h2>
              </div>
              <p className={`text-sm ${dark ? 'text-[#00e676]/60' : 'text-white/80'}`}>
                {format(new Date(), 'EEEE, MMMM do yyyy')} &mdash; here&apos;s your daily overview
              </p>

              {shiftText && (
                <div className={`mt-4 p-4 backdrop-blur-sm rounded-2xl border max-w-sm ${
                  dark ? 'bg-[#00e676]/5 border-[#00e676]/20' : 'bg-white/10 border-white/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={15} className={dark ? 'text-[#00e676]/70' : 'text-indigo-200'} />
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${dark ? 'text-[#00e676]/60' : 'text-indigo-200'}`}>
                      Shift Status
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white leading-tight">{shiftText}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${dark ? 'bg-[#00e676]/10' : 'bg-white/20'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                          dark ? 'from-[#00e676] to-[#69ff47]' : 'from-emerald-300 to-blue-300'
                        }`}
                        style={{ width: `${shiftPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white">{shiftPct}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Today's Todos */}
            <div className={`lg:w-72 w-full flex-shrink-0 backdrop-blur-sm rounded-2xl border p-4 ${
              dark ? 'bg-[#00e676]/5 border-[#00e676]/20' : 'bg-white/10 border-white/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-sm font-bold text-white">
                  <CheckSquare size={14} className={dark ? 'text-[#00e676]/70' : 'text-indigo-200'} />
                  Today&apos;s Todos
                </span>
                <button
                  onClick={() => setShowAddTodo(s => !s)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    dark ? 'bg-[#00e676]/15 hover:bg-[#00e676]/25' : 'bg-white/20 hover:bg-white/30'
                  }`}
                  title="Add todo"
                >
                  <Plus size={12} className="text-white" />
                </button>
              </div>

              {todayTodos.length === 0 && !showAddTodo ? (
                <div className="py-2 text-center">
                  <p className={`text-xs ${dark ? 'text-[#00e676]/55' : 'text-white/65'}`}>
                    Wanna add todo list for today?
                  </p>
                  <button
                    onClick={() => setShowAddTodo(true)}
                    className="mt-2 w-full text-xs text-white/60 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    + Add your first todo
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {todayTodos.map(todo => (
                    <div key={todo.id} className="flex items-start gap-2 group">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        className={`mt-0.5 cursor-pointer flex-shrink-0 ${dark ? 'accent-[#00e676]' : 'accent-indigo-400'}`}
                      />
                      <span className={cn('text-xs text-white flex-1 leading-relaxed', todo.completed && 'line-through opacity-40')}>
                        {todo.text}
                      </span>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                      >
                        <X size={10} className="text-red-300 hover:text-red-100" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showAddTodo && (
                <div className="mt-2 flex gap-1.5">
                  <input
                    value={newTodoText}
                    onChange={e => setNewTodoText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addTodo()
                      if (e.key === 'Escape') { setShowAddTodo(false); setNewTodoText('') }
                    }}
                    placeholder="Type & press Enter..."
                    className={`flex-1 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none border ${
                      dark
                        ? 'bg-[#00e676]/5 border-[#00e676]/20 placeholder-[#00e676]/40'
                        : 'bg-white/10 border-white/20 placeholder-indigo-200/60'
                    }`}
                    autoFocus
                  />
                  <button
                    onClick={addTodo}
                    className={`rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                      dark
                        ? 'bg-[#00e676]/15 hover:bg-[#00e676]/30 text-[#00e676]'
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Projects" value={projects.length} loading={loading}
            from="from-violet-600" to="to-indigo-600"
            icon={<FolderKanban size={20} />} />
          <StatCard label="Test Cases" value={testCaseCount} loading={loading}
            from="from-teal-400" to="to-cyan-600"
            icon={<ClipboardList size={20} />} />
          <StatCard label="Reports Filed" value={reportCount} loading={loading}
            from="from-violet-400" to="to-rose-500"
            icon={<FileBarChart2 size={20} />} />
          <StatCard label="Bugs Logged" value={bugCount} loading={loading}
            from="from-pink-500" to="to-rose-600"
            icon={<Bug size={20} />} />
        </div>

        {/* ── Main Grid: Projects + Side panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Projects — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Recent Projects</h3>
              <Link href="/projects" className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-700 dark:text-[#00e676]/70 dark:hover:text-[#00e676] transition-colors">
                View all <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl h-44 animate-pulse bg-indigo-100/60 dark:bg-[#0a1e0a]" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="card p-12 text-center">
                <FolderKanban size={36} className="text-violet-400/50 dark:text-[#1e4a24] mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-4">No projects yet.</p>
                <Link href="/projects">
                  <button className="btn-primary mx-auto">
                    <Plus size={14} /> Create Project
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map(p => <ProjectMiniCard key={p.id} project={p} />)}
              </div>
            )}
          </div>

          {/* Side panel — 1 col */}
          <div className="space-y-4">
            <div className="space-y-2">
              {[
                { href: '/calendar',   label: 'View Calendar',  icon: Calendar,      color: 'from-cyan-400 to-blue-500' },
                { href: '/inbox',      label: 'Check Inbox',    icon: MessageSquare, color: 'from-pink-400 to-rose-500' },
                { href: '/test-cases', label: 'Test Cases',     icon: ClipboardList, color: 'from-blue-500 to-indigo-600' },
                { href: '/bugs',       label: 'Bug Tracker',    icon: Bug,           color: 'from-violet-400 to-red-500' },
              ].map(({ href, label, icon: Icon, color }) => (
                <Link key={href} href={href}>
                  <div className="card-hover px-4 py-3 flex items-center gap-3 group">
                    <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm', color)}>
                      <Icon size={15} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-indigo-700 group-hover:text-indigo-900 dark:text-slate-300 dark:group-hover:text-[#00e676] transition-colors">
                      {label}
                    </span>
                    <ChevronRight size={14} className="ml-auto text-indigo-300/60 group-hover:text-indigo-500 dark:group-hover:text-[#00e676]/70 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Upcoming Office Days */}
            {upcomingWFO.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                    <Building2 size={13} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-900 dark:text-white">Upcoming Office Days</p>
                    <p className="text-[10px] text-indigo-400 dark:text-slate-500">Planned WFO visits</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {upcomingWFO.slice(0, 5).map(dateKey => {
                    const [y, m, d] = dateKey.split('-').map(Number)
                    const date = new Date(y, m - 1, d)
                    const isThisWeek = (date.getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000
                    return (
                      <Link key={dateKey} href="/calendar">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20 hover:border-violet-400/60 dark:hover:border-violet-400/40 transition-all group cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Briefcase size={13} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-violet-800 dark:text-violet-300 truncate">
                              {format(date, 'EEE, MMM do')}
                            </p>
                            <p className="text-[10px] text-violet-500 dark:text-violet-400/60">
                              {format(date, 'yyyy')}
                            </p>
                          </div>
                          {isThisWeek && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Soon
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                  {upcomingWFO.length > 5 && (
                    <Link href="/calendar">
                      <p className="text-xs text-center text-indigo-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-slate-300 transition-colors pt-1">
                        +{upcomingWFO.length - 5} more → View Calendar
                      </p>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── News Widget ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-emerald-500 dark:to-green-600 flex items-center justify-center shadow-md shadow-indigo-400/30 dark:shadow-emerald-500/20">
                <Newspaper size={15} className="text-white" />
              </div>
              <div>
                <h3 className="section-title text-base">Latest QA & Automation News</h3>
                <p className="text-[10px] text-slate-500 dark:text-[#2d6a3e] -mt-0.5">Live from Dev.to · refreshes hourly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!newsLoading && news.length > 3 && (
                <button
                  onClick={() => setNewsExpanded(e => !e)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {newsExpanded ? (
                    <><ChevronUp size={13} /> Show less</>
                  ) : (
                    <><ChevronDown size={13} /> Show all ({news.length})</>
                  )}
                </button>
              )}
              <button onClick={fetchNews} className="btn-secondary text-xs py-1.5 px-3">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>

          {newsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl h-48 animate-pulse bg-indigo-100/60 dark:bg-[#0a1e0a]" />
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="card p-8 text-center">
              <Newspaper size={28} className="text-violet-400/40 dark:text-[#1e4a24] mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No news loaded. Try refreshing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleNews.map((a, i) => <NewsCard key={a.id} article={a} index={i} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
