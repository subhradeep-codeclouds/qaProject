'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import ProjectCard from '@/components/ProjectCard'
import { Plus, FolderKanban, Search, Filter } from 'lucide-react'
import { supabase, type Project } from '@/lib/supabase'
import { PROJECT_COLORS, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['active', 'completed', 'on-hold'] as const

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [testCounts, setTestCounts] = useState<Record<string, number>>({})
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({})

  const [form, setForm] = useState({
    name: '', description: '', color: PROJECT_COLORS[0].value, status: 'active' as const,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (data) {
      setProjects(data)
      fetchCounts(data.map(p => p.id))
    }
    setLoading(false)
  }

  async function fetchCounts(ids: string[]) {
    const [tcRes, repRes] = await Promise.all([
      supabase.from('test_cases').select('project_id').in('project_id', ids),
      supabase.from('test_reports').select('project_id').in('project_id', ids),
    ])
    const tc: Record<string, number> = {}
    const rep: Record<string, number> = {}
    tcRes.data?.forEach(r => { tc[r.project_id] = (tc[r.project_id] ?? 0) + 1 })
    repRes.data?.forEach(r => { rep[r.project_id] = (rep[r.project_id] ?? 0) + 1 })
    setTestCounts(tc)
    setReportCounts(rep)
  }

  async function createProject() {
    if (!form.name.trim()) return toast.error('Project name is required')
    setSaving(true)
    const { error } = await supabase.from('projects').insert([{ ...form }])
    setSaving(false)
    if (error) return toast.error('Failed to create project')
    toast.success('Project created!')
    setShowModal(false)
    setForm({ name: '', description: '', color: PROJECT_COLORS[0].value, status: 'active' })
    fetchProjects()
  }

  const filtered = projects.filter(p => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div>
      <Header title="Projects" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="input-field pl-8 w-52"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
              {['all', ...STATUS_OPTIONS].map(s => (
                <button key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                    filterStatus === s
                      ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> New Project
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="glass-card h-44 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <FolderKanban size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No projects found.</p>
            <button className="btn-primary mt-4 mx-auto" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p} testCaseCount={testCounts[p.id]} reportCount={reportCounts[p.id]} />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-5">Create New Project</h3>

            <div className="space-y-4">
              <div>
                <label className="label">Project Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. E-Commerce Platform" className="input-field" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief project description..." rows={3}
                  className="input-field resize-none" />
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                  className="input-field">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map(c => (
                    <button key={c.value} onClick={() => setForm(f => ({ ...f, color: c.value }))}
                      className={cn('w-8 h-8 rounded-lg transition-all', form.color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110' : 'hover:scale-105')}
                      style={{ background: c.value }} title={c.label} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={createProject} disabled={saving}>
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
