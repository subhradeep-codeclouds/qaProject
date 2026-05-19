'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import { Plus, ClipboardList, Search, Filter, Trash2, Edit2, CheckCircle2 } from 'lucide-react'
import { supabase, type TestCase, type Project } from '@/lib/supabase'
import { cn, STATUS_STYLES, PRIORITY_STYLES, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'pass', 'fail', 'blocked', 'skipped'] as const
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const

const emptyForm = {
  title: '', description: '', steps: '', expected_result: '', actual_result: '',
  status: 'pending' as const, priority: 'medium' as const, category: '', project_id: '',
}

export default function TestCasesPage() {
  const searchParams = useSearchParams()
  const preselectedProject = searchParams.get('project') ?? ''

  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterProject, setFilterProject] = useState(preselectedProject)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ ...emptyForm, project_id: preselectedProject })
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [tcRes, projRes] = await Promise.all([
      supabase.from('test_cases').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, color').order('name'),
    ])
    if (tcRes.data) setTestCases(tcRes.data)
    if (projRes.data) setProjects(projRes.data as any)
    setLoading(false)
  }

  async function saveTestCase() {
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.project_id) return toast.error('Select a project')
    setSaving(true)
    const { error } = await supabase.from('test_cases').insert([form])
    setSaving(false)
    if (error) return toast.error('Failed to save test case')
    toast.success('Test case added!')
    setShowModal(false)
    setForm({ ...emptyForm, project_id: preselectedProject })
    fetchData()
  }

  async function updateStatus(id: string, status: typeof STATUSES[number]) {
    await supabase.from('test_cases').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  async function deleteTC(id: string) {
    await supabase.from('test_cases').delete().eq('id', id)
    toast.success('Test case deleted')
    fetchData()
  }

  const filtered = testCases.filter(tc => {
    const matchStatus = filterStatus === 'all' || tc.status === filterStatus
    const matchProject = !filterProject || tc.project_id === filterProject
    const matchSearch = tc.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchProject && matchSearch
  })

  const projectName = (id: string) => projects.find(p => p.id === id)?.name ?? 'Unknown'

  return (
    <div>
      <Header title="Test Cases" />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-3">
          {['all', ...STATUSES].map(s => {
            const count = s === 'all' ? testCases.length : testCases.filter(tc => tc.status === s).length
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={cn('glass-card p-3 text-center transition-all hover:border-white/[0.15]',
                  filterStatus === s ? 'border-violet-500/40 bg-violet-500/10' : '')}>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className={cn('text-[10px] font-medium capitalize mt-0.5',
                  s === 'pass' ? 'text-emerald-400' : s === 'fail' ? 'text-red-400' :
                  s === 'blocked' ? 'text-orange-400' : s === 'skipped' ? 'text-slate-400' :
                  s === 'pending' ? 'text-blue-400' : 'text-slate-300')}>
                  {s === 'all' ? 'Total' : s}
                </p>
              </button>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search test cases..." className="input-field pl-8 w-52" />
            </div>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
              className="input-field w-44">
              <option value="">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Test Case
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="glass-card h-14 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <ClipboardList size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No test cases found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(tc => (
              <div key={tc.id} className="glass-card overflow-hidden">
                <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02]"
                  onClick={() => setExpandedId(expandedId === tc.id ? null : tc.id)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{projectName(tc.project_id)}</span>
                      {tc.category && <span className="text-xs text-slate-600">· {tc.category}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('badge text-[10px]', PRIORITY_STYLES[tc.priority])}>{tc.priority}</span>
                    <select value={tc.status}
                      onChange={e => { e.stopPropagation(); updateStatus(tc.id, e.target.value as any) }}
                      onClick={e => e.stopPropagation()}
                      className={cn('badge text-[10px] border cursor-pointer bg-transparent', STATUS_STYLES[tc.status])}>
                      {STATUSES.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                    </select>
                    <button onClick={e => { e.stopPropagation(); deleteTC(tc.id) }}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>
                {expandedId === tc.id && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/[0.06] pt-3">
                    {tc.description && <div><p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Description</p><p className="text-xs text-slate-400">{tc.description}</p></div>}
                    {tc.steps && <div><p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Steps</p><p className="text-xs text-slate-400 whitespace-pre-wrap">{tc.steps}</p></div>}
                    {tc.expected_result && <div><p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Expected Result</p><p className="text-xs text-slate-400">{tc.expected_result}</p></div>}
                    {tc.actual_result && <div><p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Actual Result</p><p className="text-xs text-slate-400">{tc.actual_result}</p></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Test Case Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-5">Add Test Case</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Verify user login with valid credentials" className="input-field" />
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
                <label className="label">Category</label>
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Authentication, UI, API" className="input-field" />
              </div>
              <div>
                <label className="label">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}
                  className="input-field">
                  {PRIORITIES.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                  className="input-field">
                  {STATUSES.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What does this test case verify?" rows={2} className="input-field resize-none" />
              </div>
              <div className="col-span-2">
                <label className="label">Test Steps</label>
                <textarea value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
                  placeholder="1. Go to login page&#10;2. Enter credentials&#10;3. Click login" rows={4} className="input-field resize-none" />
              </div>
              <div>
                <label className="label">Expected Result</label>
                <textarea value={form.expected_result} onChange={e => setForm(f => ({ ...f, expected_result: e.target.value }))}
                  placeholder="User should be redirected to dashboard" rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="label">Actual Result</label>
                <textarea value={form.actual_result} onChange={e => setForm(f => ({ ...f, actual_result: e.target.value }))}
                  placeholder="Leave blank if not tested yet" rows={3} className="input-field resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={saveTestCase} disabled={saving}>
                {saving ? 'Saving...' : 'Save Test Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
