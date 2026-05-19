'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import { Plus, FileBarChart2, CheckCircle2, XCircle, AlertTriangle, Clock, Bug, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase, type TestReport, type Project } from '@/lib/supabase'
import { cn, formatDate, getProjectGradient } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const ENVS = ['staging', 'production', 'development', 'UAT', 'QA']

const emptyForm = {
  title: '', project_id: '', test_date: format(new Date(), 'yyyy-MM-dd'),
  environment: 'staging', total_cases: 0, passed: 0, failed: 0,
  blocked: 0, skipped: 0, bugs_found: 0, summary: '', notes: '',
}

export default function ReportsPage() {
  const searchParams = useSearchParams()
  const preProject = searchParams.get('project') ?? ''

  const [reports, setReports] = useState<(TestReport & { project_name?: string; project_color?: string })[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterProject, setFilterProject] = useState(preProject)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm, project_id: preProject })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [repRes, projRes] = await Promise.all([
      supabase.from('test_reports').select('*, projects(name, color)').order('test_date', { ascending: false }),
      supabase.from('projects').select('id, name, color').order('name'),
    ])
    if (repRes.data) {
      setReports(repRes.data.map((r: any) => ({ ...r, project_name: r.projects?.name, project_color: r.projects?.color })))
    }
    if (projRes.data) setProjects(projRes.data as any)
    setLoading(false)
  }

  function updateTotal() {
    const total = form.passed + form.failed + form.blocked + form.skipped
    setForm(f => ({ ...f, total_cases: total }))
  }

  async function saveReport() {
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.project_id) return toast.error('Select a project')
    setSaving(true)
    const total = form.passed + form.failed + form.blocked + form.skipped
    const { error } = await supabase.from('test_reports').insert([{ ...form, total_cases: total }])
    setSaving(false)
    if (error) return toast.error('Failed to save report')
    toast.success('Report saved!')
    setShowModal(false)
    setForm({ ...emptyForm, project_id: preProject })
    fetchData()
  }

  const filtered = reports.filter(r => !filterProject || r.project_id === filterProject)

  function PassBar({ passed, failed, blocked, skipped }: { passed: number, failed: number, blocked: number, skipped: number }) {
    const total = passed + failed + blocked + skipped || 1
    return (
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-emerald-500 rounded-full" style={{ width: `${(passed / total) * 100}%` }} />
        <div className="bg-red-500 rounded-full" style={{ width: `${(failed / total) * 100}%` }} />
        <div className="bg-orange-500 rounded-full" style={{ width: `${(blocked / total) * 100}%` }} />
        <div className="bg-slate-500 rounded-full" style={{ width: `${(skipped / total) * 100}%` }} />
      </div>
    )
  }

  return (
    <div>
      <Header title="Test Reports" />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="input-field w-52">
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> New Report
          </button>
        </div>

        {/* Summary stats */}
        {reports.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Reports', val: reports.length, color: 'text-violet-400' },
              { label: 'Total Passed', val: reports.reduce((s, r) => s + r.passed, 0), color: 'text-emerald-400' },
              { label: 'Total Failed', val: reports.reduce((s, r) => s + r.failed, 0), color: 'text-red-400' },
              { label: 'Total Bugs', val: reports.reduce((s, r) => s + r.bugs_found, 0), color: 'text-pink-400' },
            ].map(s => (
              <div key={s.label} className="glass-card p-4 text-center">
                <p className={cn('text-2xl font-bold', s.color)}>{s.val}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Reports list */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="glass-card h-28 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <FileBarChart2 size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No reports yet. Add your first test report.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <div key={r.id} className="glass-card overflow-hidden">
                <div className="p-5 cursor-pointer hover:bg-white/[0.02]"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0')} style={{ background: r.project_color ?? '#8b5cf6' }} />
                        <span className="text-xs text-slate-500">{r.project_name}</span>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500">{formatDate(r.test_date)}</span>
                        {r.environment && <span className="badge bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">{r.environment}</span>}
                      </div>
                      <p className="font-semibold text-white">{r.title}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {expandedId === r.id
                        ? <ChevronUp size={16} className="text-slate-500" />
                        : <ChevronDown size={16} className="text-slate-500" />}
                    </div>
                  </div>

                  <div className="mt-3">
                    <PassBar passed={r.passed} failed={r.failed} blocked={r.blocked} skipped={r.skipped} />
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 size={12} /> {r.passed} passed
                      </span>
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <XCircle size={12} /> {r.failed} failed
                      </span>
                      <span className="flex items-center gap-1 text-xs text-orange-400">
                        <AlertTriangle size={12} /> {r.blocked} blocked
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={12} /> {r.skipped} skipped
                      </span>
                      {r.bugs_found > 0 && (
                        <span className="flex items-center gap-1 text-xs text-pink-400 ml-auto">
                          <Bug size={12} /> {r.bugs_found} bugs
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {expandedId === r.id && (
                  <div className="px-5 pb-5 pt-3 border-t border-white/[0.05] space-y-3">
                    {r.summary && (
                      <div>
                        <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Summary</p>
                        <p className="text-sm text-slate-300">{r.summary}</p>
                      </div>
                    )}
                    {r.notes && (
                      <div>
                        <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-slate-400 whitespace-pre-wrap">{r.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Report Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-5">New Test Report</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Report Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Daily Regression - May 19" className="input-field" />
              </div>
              <div>
                <label className="label">Project *</label>
                <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                  className="input-field">
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Test Date</label>
                <input type="date" value={form.test_date} onChange={e => setForm(f => ({ ...f, test_date: e.target.value }))}
                  className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="label">Environment</label>
                <div className="flex gap-2 flex-wrap">
                  {ENVS.map(env => (
                    <button key={env} onClick={() => setForm(f => ({ ...f, environment: env }))}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        form.environment === env
                          ? 'border-violet-500/50 bg-violet-500/20 text-violet-300'
                          : 'border-white/[0.08] text-slate-500 hover:text-slate-300 bg-white/[0.03]'
                      )}>
                      {env}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="label">Test Results</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: 'passed', label: 'Passed', color: 'text-emerald-400' },
                    { key: 'failed', label: 'Failed', color: 'text-red-400' },
                    { key: 'blocked', label: 'Blocked', color: 'text-orange-400' },
                    { key: 'skipped', label: 'Skipped', color: 'text-slate-400' },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="glass-card p-3 text-center">
                      <p className={cn('text-xs font-medium mb-2', color)}>{label}</p>
                      <input type="number" min="0" value={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                        className="input-field text-center text-lg font-bold p-1" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Bugs Found</label>
                <input type="number" min="0" value={form.bugs_found}
                  onChange={e => setForm(f => ({ ...f, bugs_found: parseInt(e.target.value) || 0 }))}
                  className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="label">Summary</label>
                <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                  placeholder="Brief summary of what was tested..." rows={2} className="input-field resize-none" />
              </div>
              <div className="col-span-2">
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes, observations, follow-up items..." rows={3} className="input-field resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={saveReport} disabled={saving}>
                {saving ? 'Saving...' : 'Save Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
