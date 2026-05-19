'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { Bug, Plus, Trash2, AlertTriangle, ChevronDown } from 'lucide-react'
import { supabase, type Project } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type BugEntry = {
  id: string
  project_id: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in-progress' | 'fixed' | 'closed'
  description: string | null
  steps_to_reproduce: string | null
  environment: string | null
  created_at: string
}

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const
const STATUSES = ['open', 'in-progress', 'fixed', 'closed'] as const

const SEV_STYLES = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low:      'bg-green-500/20 text-green-400 border-green-500/30',
}

const STATUS_STYLES = {
  'open':        'bg-red-500/20 text-red-400 border-red-500/30',
  'in-progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'fixed':       'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'closed':      'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const emptyForm = {
  title: '', project_id: '', severity: 'high' as const, status: 'open' as const,
  description: '', steps_to_reproduce: '', environment: 'staging',
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<BugEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [bugsRes, projRes] = await Promise.all([
      supabase.from('bugs').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').order('name'),
    ])
    if (bugsRes.data) setBugs(bugsRes.data as any)
    if (projRes.data) setProjects(projRes.data as any)
    setLoading(false)
  }

  async function saveBug() {
    if (!form.title.trim()) return toast.error('Title required')
    if (!form.project_id) return toast.error('Select a project')
    setSaving(true)
    const { error } = await supabase.from('bugs').insert([form])
    setSaving(false)
    if (error) return toast.error('Failed to log bug')
    toast.success('Bug logged!')
    setShowModal(false)
    setForm(emptyForm)
    fetchData()
  }

  async function updateBugStatus(id: string, status: string) {
    await supabase.from('bugs').update({ status }).eq('id', id)
    fetchData()
  }

  async function deleteBug(id: string) {
    await supabase.from('bugs').delete().eq('id', id)
    toast.success('Bug deleted')
    fetchData()
  }

  const filtered = bugs.filter(b => {
    const ms = filterStatus === 'all' || b.status === filterStatus
    const msev = filterSeverity === 'all' || b.severity === filterSeverity
    return ms && msev
  })

  const projectName = (id: string) => projects.find(p => p.id === id)?.name ?? '—'

  return (
    <div>
      <Header title="Bug Tracker" />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Open', count: bugs.filter(b => b.status === 'open').length, color: 'text-red-400' },
            { label: 'In Progress', count: bugs.filter(b => b.status === 'in-progress').length, color: 'text-blue-400' },
            { label: 'Fixed', count: bugs.filter(b => b.status === 'fixed').length, color: 'text-emerald-400' },
            { label: 'Critical', count: bugs.filter(b => b.severity === 'critical').length, color: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className={cn('text-2xl font-bold', s.color)}>{s.count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-36">
              <option value="all">All Status</option>
              {STATUSES.map(s => <option key={s} value={s} className="bg-slate-900 capitalize">{s}</option>)}
            </select>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="input-field w-36">
              <option value="all">All Severity</option>
              {SEVERITIES.map(s => <option key={s} value={s} className="bg-slate-900 capitalize">{s}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Log Bug
          </button>
        </div>

        {/* Bug list */}
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="glass-card h-16 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Bug size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No bugs logged. Great job!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(bug => (
              <div key={bug.id} className="glass-card p-4 flex items-center gap-4 group">
                <AlertTriangle size={16} className={cn(
                  bug.severity === 'critical' ? 'text-red-400' :
                  bug.severity === 'high' ? 'text-orange-400' :
                  bug.severity === 'medium' ? 'text-yellow-400' : 'text-green-400'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{bug.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{projectName(bug.project_id)}</span>
                    {bug.environment && <span className="text-xs text-slate-600">· {bug.environment}</span>}
                    <span className="text-xs text-slate-600">· {formatDate(bug.created_at)}</span>
                  </div>
                </div>
                <span className={cn('badge text-[10px]', SEV_STYLES[bug.severity])}>{bug.severity}</span>
                <select value={bug.status}
                  onChange={e => updateBugStatus(bug.id, e.target.value)}
                  className={cn('badge text-[10px] border cursor-pointer bg-transparent', STATUS_STYLES[bug.status])}>
                  {STATUSES.map(s => <option key={s} value={s} className="bg-slate-900 capitalize">{s}</option>)}
                </select>
                <button onClick={() => deleteBug(bug.id)}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-5">Log New Bug</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Bug Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Login button unresponsive on mobile" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Project *</label>
                  <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                    className="input-field">
                    <option value="">Select project</option>
                    {projects.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Environment</label>
                  <input value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}
                    placeholder="staging, prod..." className="input-field" />
                </div>
                <div>
                  <label className="label">Severity</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as any }))}
                    className="input-field">
                    {SEVERITIES.map(s => <option key={s} value={s} className="bg-slate-900 capitalize">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className="input-field">
                    {STATUSES.map(s => <option key={s} value={s} className="bg-slate-900 capitalize">{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What happened?" rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="label">Steps to Reproduce</label>
                <textarea value={form.steps_to_reproduce}
                  onChange={e => setForm(f => ({ ...f, steps_to_reproduce: e.target.value }))}
                  placeholder="1. Go to...&#10;2. Click..." rows={4} className="input-field resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={saveBug} disabled={saving}>
                {saving ? 'Saving...' : 'Log Bug'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
