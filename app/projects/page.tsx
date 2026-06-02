'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import ProjectCard from '@/components/ProjectCard'
import { Plus, FolderKanban, Search, X } from 'lucide-react'
import { supabase, type Project } from '@/lib/supabase'
import { PROJECT_COLORS, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['active', 'completed', 'on-hold'] as const
type Status = typeof STATUS_OPTIONS[number]

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', completed: 'Completed', 'on-hold': 'On Hold',
}

export default function ProjectsPage() {
  const [projects, setProjects]       = useState<Project[]>([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch]           = useState('')
  const [testCounts, setTestCounts]   = useState<Record<string, number>>({})
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({})
  const [saving, setSaving]           = useState(false)

  const [form, setForm] = useState({
    name: '', description: '', color: PROJECT_COLORS[0].value, status: 'active' as Status,
  })

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setProjects(data)
      if (data.length) fetchCounts(data.map(p => p.id))
    }
    setLoading(false)
  }

  async function fetchCounts(ids: string[]) {
    const [tcRes, repRes] = await Promise.all([
      supabase.from('test_cases').select('project_id').in('project_id', ids),
      supabase.from('test_reports').select('project_id').in('project_id', ids),
    ])
    const tc: Record<string, number>  = {}
    const rep: Record<string, number> = {}
    tcRes.data?.forEach(r  => { tc[r.project_id]  = (tc[r.project_id]  ?? 0) + 1 })
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
    closeModal()
    fetchProjects()
  }

  function closeModal() {
    setShowModal(false)
    setForm({ name: '', description: '', color: PROJECT_COLORS[0].value, status: 'active' })
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
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="input-field pl-9 w-52"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#122240] border border-orange-100 dark:border-[#1a3355] rounded-xl p-1">
              {['all', ...STATUS_OPTIONS].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                    filterStatus === s
                      ? 'bg-gradient-to-r from-orange-500 to-blue-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  {s === 'all' ? 'All' : STATUS_LABELS[s]}
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
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-44 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <FolderKanban size={40} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No projects found.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-5">
              {search ? 'Try a different search term.' : 'Create your first project to get started.'}
            </p>
            {!search && (
              <button className="btn-primary mx-auto" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                testCaseCount={testCounts[p.id]}
                reportCount={reportCounts[p.id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#122240] border border-orange-100 dark:border-[#1a3355] rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-orange-50 dark:border-[#1a3355]">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Create New Project</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Fill in the details below</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-orange-50 dark:hover:bg-[#1a3355] transition-colors"
              >
                <X size={15} className="text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="label">Project Name <span className="text-red-400 normal-case">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. E-Commerce Platform"
                  className="input-field"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && createProject()}
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description <span className="text-slate-300 dark:text-slate-600 normal-case font-normal">(optional)</span></label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief project description..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="label">Status</label>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                        form.status === s
                          ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300'
                          : 'border-slate-200 dark:border-[#1a3355] text-slate-500 dark:text-slate-400 hover:border-orange-200 dark:hover:border-orange-500/40'
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="label">Accent Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setForm(f => ({ ...f, color: c.value }))}
                      title={c.label}
                      className={cn(
                        'w-8 h-8 rounded-lg transition-all',
                        form.color === c.value
                          ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#122240] scale-110'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      )}
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  Selected: <span className="font-medium text-slate-600 dark:text-slate-300">{PROJECT_COLORS.find(c => c.value === form.color)?.label}</span>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-5">
              <button className="btn-secondary flex-1 justify-center" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn-primary flex-1 justify-center"
                onClick={createProject}
                disabled={saving || !form.name.trim()}
              >
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
