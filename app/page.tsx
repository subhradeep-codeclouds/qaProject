'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import {
  FolderKanban, ClipboardList, FileBarChart2, Bug,
  Calendar, MessageSquare, Plus, ArrowRight, CheckCircle2,
  XCircle, AlertTriangle, Newspaper, ExternalLink,
  ChevronRight, ChevronDown, ChevronUp, Clock, Zap,
  RefreshCw, BookOpen, Tag
} from 'lucide-react'
import { supabase, type Project, type TestReport } from '@/lib/supabase'
import { formatDate, getProjectGradient, cn } from '@/lib/utils'
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
        <p className="text-2xl font-bold text-slate-800">
          {loading ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" /> : value}
        </p>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
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
          <ExternalLink size={11} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
        </div>
      </div>
    </Link>
  )
}

// ── News card ─────────────────────────────────────────────────
function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
       className="card-hover p-4 group flex flex-col gap-2">
      {article.cover_image && (
        <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100">
          <img src={article.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {article.tag_list.slice(0, 2).map(t => (
          <span key={t} className="badge bg-orange-50 text-orange-600 border-orange-100 text-[9px] dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50">
            <Tag size={8} className="mr-0.5" />{t}
          </span>
        ))}
      </div>
      <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
        {article.title}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[10px] text-slate-400">{article.user.name} · {article.readable_publish_date}</span>
        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
          <BookOpen size={9} /> {article.reading_time_minutes}m
        </span>
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
  const [recentReports, setRecentReports] = useState<(TestReport & { project_name?: string })[]>([])
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
      supabase.from('test_reports').select('*, projects(name)').order('created_at', { ascending: false }).limit(5),
    ])
    if (projectsRes.data) setProjects(projectsRes.data)
    if (testCasesRes.count !== null) setTestCaseCount(testCasesRes.count)
    if (reportsRes.data) {
      setReportCount(reportsRes.data.length)
      setRecentReports(reportsRes.data.map((r: any) => ({ ...r, project_name: r.projects?.name })))
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6 max-w-[1400px]">

        {/* ── Welcome Banner ── */}
        <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl shadow-orange-200/50 dark:shadow-orange-900/20"
          style={{ background: 'linear-gradient(135deg,#f97316 0%,#3b82f6 55%,#ea580c 100%)' }}>
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-full opacity-20 pointer-events-none">
            <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/40 blur-2xl" />
            <div className="absolute bottom-2 right-24 w-20 h-20 rounded-full bg-blue-300/50 blur-xl" />
          </div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-orange-400/20 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{greeting.emoji}</span>
                <h2 className="text-xl font-bold text-white">{greeting.label}, Subhradeep!</h2>
              </div>
              <p className="text-orange-100 text-sm">
                {format(new Date(), 'EEEE, MMMM do yyyy')} &mdash; here&apos;s your daily overview
              </p>

              {/* shift progress */}
              {shiftText && (
                <div className="mt-3 flex items-center gap-3">
                  <Clock size={13} className="text-orange-200 shrink-0" />
                  <span className="text-xs text-orange-100">{shiftText}</span>
                  <div className="flex-1 max-w-[120px] h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-white/80 to-blue-200 rounded-full transition-all duration-1000"
                      style={{ width: `${shiftPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-orange-200">{shiftPct}%</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <Link href="/reports">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-orange-600 font-semibold text-sm shadow hover:bg-orange-50 transition-all">
                  <Plus size={15} /> Add Report
                </button>
              </Link>
              <Link href="/standup">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 text-white font-semibold text-sm hover:bg-white/30 transition-all border border-white/30">
                  <Zap size={15} /> Standup
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Projects" value={projects.length} loading={loading}
            from="from-orange-500" to="to-amber-600"
            icon={<FolderKanban size={20} />} />
          <StatCard label="Test Cases" value={testCaseCount} loading={loading}
            from="from-teal-400" to="to-cyan-600"
            icon={<ClipboardList size={20} />} />
          <StatCard label="Reports Filed" value={reportCount} loading={loading}
            from="from-orange-400" to="to-rose-500"
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
              <Link href="/projects" className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors">
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
                <FolderKanban size={36} className="text-orange-200 mx-auto mb-3" />
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

            {/* Recent Reports */}
            <div className="flex items-center justify-between">
              <h3 className="section-title text-base">Recent Reports</h3>
              <Link href="/reports" className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors">
                All <ArrowRight size={13} />
              </Link>
            </div>

            <div className="space-y-2">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-slate-50" />)
              ) : recentReports.length === 0 ? (
                <div className="card p-8 text-center">
                  <FileBarChart2 size={28} className="text-orange-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">No reports yet.</p>
                </div>
              ) : (
                recentReports.map(r => (
                  <Link key={r.id} href="/reports">
                    <div className="card-hover p-3 group">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">{formatDate(r.test_date)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">{r.project_name}</p>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                          <CheckCircle2 size={10} /> {r.passed}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-red-500">
                          <XCircle size={10} /> {r.failed}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500">
                          <AlertTriangle size={10} /> {r.blocked}
                        </span>
                        {r.bugs_found > 0 && (
                          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-pink-500">
                            <Bug size={10} /> {r.bugs_found}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Quick links */}
            <div className="pt-2 space-y-2">
              {[
                { href: '/calendar',   label: 'View Calendar',  icon: Calendar,      color: 'from-cyan-400 to-blue-500' },
                { href: '/inbox',      label: 'Check Inbox',    icon: MessageSquare, color: 'from-pink-400 to-rose-500' },
                { href: '/test-cases', label: 'Test Cases',     icon: ClipboardList, color: 'from-blue-500 to-indigo-600' },
                { href: '/bugs',       label: 'Bug Tracker',    icon: Bug,           color: 'from-orange-400 to-red-500' },
              ].map(({ href, label, icon: Icon, color }) => (
                <Link key={href} href={href}>
                  <div className="card-hover px-4 py-3 flex items-center gap-3 group">
                    <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm', color)}>
                      <Icon size={15} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">{label}</span>
                    <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-orange-400 transition-colors" />
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center shadow-md shadow-orange-200 dark:shadow-orange-900/30">
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
              {visibleNews.map(a => <NewsCard key={a.id} article={a} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
