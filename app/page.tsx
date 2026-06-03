'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import {
  FolderKanban, ClipboardList, FileBarChart2, Bug,
  Calendar, MessageSquare, Plus, ArrowRight,
  Newspaper, ExternalLink,
  ChevronRight, ChevronDown, ChevronUp, Clock,
  RefreshCw
} from 'lucide-react'
import { supabase, type Project } from '@/lib/supabase'
import { getProjectGradient, cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import type { NewsArticle } from '@/app/api/news/route'

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
    <div className="card p-5 flex items-center gap-4 hover:shadow-md hover:border-violet-200 transition-all duration-200">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-md text-white shrink-0 bg-gradient-to-br', from, to)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {loading ? <span className="inline-block w-8 h-6 bg-slate-100 dark:bg-[#1a3355] rounded animate-pulse" /> : value}
        </p>
        <p className="text-xs font-semibold text-slate-400 dark:text-[#4a7aaa] uppercase tracking-wide mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Project mini card ─────────────────────────────────────────
const STATUS_CHIP: Record<string, string> = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  paused:    'bg-amber-50 text-amber-700 border-amber-200',
  'on-hold': 'bg-amber-50 text-amber-700 border-amber-200',
  archived:  'bg-slate-50 text-slate-500 border-slate-200',
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
        <h4 className="font-semibold text-slate-800 text-sm truncate mb-1">{project.name}</h4>
        <p className="text-xs text-slate-400 line-clamp-2 min-h-[2rem]">
          {project.description ?? 'No description.'}
        </p>
        <div className="flex items-center justify-end mt-3">
          <ExternalLink size={11} className="text-slate-300 group-hover:text-violet-500 transition-colors" />
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
       className="group flex flex-col overflow-hidden rounded-2xl border border-violet-100 dark:border-[#1a3355] bg-white dark:bg-[#122240] hover:shadow-xl hover:shadow-violet-200/40 dark:hover:shadow-violet-900/30 hover:-translate-y-1 transition-all duration-300">
      <div className={`h-1.5 bg-gradient-to-r ${accent} flex-shrink-0`} />
      {article.cover_image && (
        <div className="w-full h-36 overflow-hidden bg-slate-100 dark:bg-[#0c2040]">
          <img src={article.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="flex-1 flex flex-col p-4 gap-2.5">
        {article.tag_list.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tag_list.slice(0, 3).map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 uppercase tracking-wide">
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-3 leading-snug group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors flex-1">
          {article.title}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1a3355]">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0`}>
              <span className="text-[9px] text-white font-black">{article.user.name.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[100px]">{article.user.name}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
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
  const [projects, setProjects] = useState<Project[]>([])
  const [testCaseCount, setTestCaseCount] = useState(0)
  const [reportCount, setReportCount] = useState(0)
  const [bugCount, setBugCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsExpanded, setNewsExpanded] = useState(false)
  const { text: shiftText, pct: shiftPct } = useShiftCountdown()
  const greeting = getGreeting()

  useEffect(() => {
    fetchDashboardData()
    fetchNews()
  }, [])

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

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6 max-w-[1400px]">

        {/* ── Welcome Banner ── */}
        <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl shadow-violet-200/50 dark:shadow-violet-900/20"
          style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#3b82f6 55%,#4f46e5 100%)' }}>
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-full opacity-20 pointer-events-none">
            <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/40 blur-2xl" />
            <div className="absolute bottom-2 right-24 w-20 h-20 rounded-full bg-blue-300/50 blur-xl" />
          </div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-violet-400/20 blur-2xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{greeting.emoji}</span>
              <h2 className="text-xl font-bold text-white">{greeting.label}, Subhradeep!</h2>
            </div>
            <p className="text-violet-100 text-sm">
              {format(new Date(), 'EEEE, MMMM do yyyy')} &mdash; here&apos;s your daily overview
            </p>

            {/* shift progress — prominent display */}
            {shiftText && (
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={15} className="text-violet-200" />
                  <span className="text-[11px] font-semibold text-violet-200 uppercase tracking-widest">Shift Status</span>
                </div>
                <p className="text-2xl font-black text-white leading-tight">{shiftText}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-300 to-blue-300 rounded-full transition-all duration-1000"
                      style={{ width: `${shiftPct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{shiftPct}%</span>
                </div>
              </div>
            )}
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
              <Link href="/projects" className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 transition-colors">
                View all <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card h-44 animate-pulse bg-slate-50" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="card p-12 text-center">
                <FolderKanban size={36} className="text-violet-200 mx-auto mb-3" />
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

            {/* Quick links */}
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
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">{label}</span>
                    <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-violet-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── News Widget ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-md shadow-violet-200 dark:shadow-violet-900/30">
                <Newspaper size={15} className="text-white" />
              </div>
              <div>
                <h3 className="section-title text-base">Latest QA & Automation News</h3>
                <p className="text-[10px] text-slate-400 -mt-0.5">Live from Dev.to · refreshes hourly</p>
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
                <div key={i} className="card h-48 animate-pulse bg-slate-50" />
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="card p-8 text-center">
              <Newspaper size={28} className="text-violet-200 mx-auto mb-2" />
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
