'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import StatsCard from '@/components/StatsCard'
import ProjectCard from '@/components/ProjectCard'
import {
  FolderKanban, ClipboardList, FileBarChart2, Bug,
  Calendar, MessageSquare, Plus, ArrowRight, CheckCircle2,
  Clock, XCircle, AlertTriangle
} from 'lucide-react'
import { supabase, type Project, type TestReport } from '@/lib/supabase'
import { formatDate, getProjectGradient, cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [testCaseCount, setTestCaseCount] = useState(0)
  const [reportCount, setReportCount] = useState(0)
  const [bugCount, setBugCount] = useState(0)
  const [recentReports, setRecentReports] = useState<(TestReport & { project_name?: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    const [projectsRes, testCasesRes, reportsRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('test_cases').select('id', { count: 'exact' }),
      supabase.from('test_reports').select('*, projects(name)').order('created_at', { ascending: false }).limit(5),
    ])

    if (projectsRes.data) setProjects(projectsRes.data)
    if (testCasesRes.count !== null) setTestCaseCount(testCasesRes.count)
    if (reportsRes.data) {
      setReportCount(reportsRes.data.length)
      const mapped = reportsRes.data.map((r: any) => ({ ...r, project_name: r.projects?.name }))
      setRecentReports(mapped)

      const totalBugs = reportsRes.data.reduce((sum: number, r: any) => sum + (r.bugs_found ?? 0), 0)
      setBugCount(totalBugs)
    }
    setLoading(false)
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6 space-y-8 animate-fade-in">

        {/* Welcome banner */}
        <div className="glass-card p-6 bg-gradient-to-r from-violet-600/10 via-indigo-600/5 to-transparent border-violet-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full opacity-10 bg-gradient-to-l from-violet-500 to-transparent" />
          <h2 className="text-xl font-bold text-white mb-1">
            Good {getGreeting()}, QA Engineer! 👋
          </h2>
          <p className="text-sm text-slate-400">
            Today is {format(new Date(), 'EEEE, MMMM do yyyy')}. Here&apos;s your daily overview.
          </p>
          <div className="flex gap-3 mt-4">
            <Link href="/reports">
              <button className="btn-primary">
                <Plus size={15} /> Add Test Report
              </button>
            </Link>
            <Link href="/standup">
              <button className="btn-secondary">
                <FileBarChart2 size={15} /> Write Standup
              </button>
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active Projects"
            value={loading ? '—' : projects.length}
            subtitle="Total in system"
            icon={FolderKanban}
            gradient="from-violet-500 to-purple-600"
          />
          <StatsCard
            title="Test Cases"
            value={loading ? '—' : testCaseCount}
            subtitle="Across all projects"
            icon={ClipboardList}
            gradient="from-teal-400 to-cyan-600"
          />
          <StatsCard
            title="Reports Filed"
            value={loading ? '—' : reportCount}
            subtitle="All time"
            icon={FileBarChart2}
            gradient="from-orange-400 to-red-500"
          />
          <StatsCard
            title="Bugs Found"
            value={loading ? '—' : bugCount}
            subtitle="From all reports"
            icon={Bug}
            gradient="from-pink-500 to-rose-600"
          />
        </div>

        {/* Main grid — Recent projects + Recent reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent projects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Recent Projects</h3>
              <Link href="/projects" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="glass-card h-44 animate-pulse" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <FolderKanban size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No projects yet.</p>
                <Link href="/projects">
                  <button className="btn-primary mt-4 mx-auto">
                    <Plus size={14} /> Create Project
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            )}
          </div>

          {/* Recent Reports */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Recent Reports</h3>
              <Link href="/reports" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="glass-card h-20 animate-pulse" />)
              ) : recentReports.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <FileBarChart2 size={28} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">No reports yet.</p>
                </div>
              ) : (
                recentReports.map(report => (
                  <Link key={report.id} href={`/reports`}>
                    <div className="glass-card-hover p-4 cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-white truncate flex-1">{report.title}</p>
                        <span className="text-[10px] text-slate-500 ml-2 flex-shrink-0">{formatDate(report.test_date)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{report.project_name}</p>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <CheckCircle2 size={10} /> {report.passed}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-red-400">
                          <XCircle size={10} /> {report.failed}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-orange-400">
                          <AlertTriangle size={10} /> {report.blocked}
                        </span>
                        {report.bugs_found > 0 && (
                          <span className="ml-auto flex items-center gap-1 text-[10px] text-pink-400">
                            <Bug size={10} /> {report.bugs_found} bugs
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick links row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: '/calendar', label: 'View Calendar', icon: Calendar, color: 'from-cyan-500 to-blue-600', sub: 'Check your meetings' },
            { href: '/inbox', label: 'Check Inbox', icon: MessageSquare, color: 'from-pink-500 to-rose-600', sub: 'Telegram & Teams' },
            { href: '/test-cases', label: 'Test Cases', icon: ClipboardList, color: 'from-violet-500 to-purple-600', sub: 'Manage all cases' },
            { href: '/bugs', label: 'Bug Tracker', icon: Bug, color: 'from-orange-400 to-red-500', sub: 'Log & track bugs' },
          ].map(({ href, label, icon: Icon, color, sub }) => (
            <Link key={href} href={href}>
              <div className="glass-card-hover p-4 text-center cursor-pointer group">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br mx-auto mb-3 flex items-center justify-center shadow-lg', color)}>
                  <Icon size={18} className="text-white" />
                </div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
