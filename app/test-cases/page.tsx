'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import { Plus, ClipboardList, Search, Trash2, Eye, ExternalLink } from 'lucide-react'
import { supabase, type TestCase, type Project } from '@/lib/supabase'
import { cn, STATUS_STYLES, PRIORITY_STYLES } from '@/lib/utils'
import { sanitizeUrl, getGoogleSheetsEmbedUrl } from '@/lib/security'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'pass', 'fail', 'blocked', 'skipped'] as const

const emptyForm = {
  title: '',
  project_id: '',
  description: '',   // stores the Google Sheet URL
  status: 'pending' as const,
  priority: 'medium' as const,
}

// Sheet viewer state lifted to top level via prop drilling isn't needed here;
// use local state for the preview modal.
function TestCasesContent() {
  const searchParams = useSearchParams()
  const preselectedProject = searchParams.get('project') ?? ''

  const [testCases,    setTestCases]    = useState<TestCase[]>([])
  const [projects,     setProjects]     = useState<Project[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterProject,setFilterProject]= useState(preselectedProject)
  const [search,       setSearch]       = useState('')
  const [form,         setForm]         = useState({ ...emptyForm, project_id: preselectedProject })
  const [saving,       setSaving]       = useState(false)
  const [viewUrl,      setViewUrl]      = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [tcRes, projRes] = await Promise.all([
      supabase.from('test_cases').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, color').order('name'),
    ])
    if (tcRes.data)   setTestCases(tcRes.data)
    if (projRes.data) setProjects(projRes.data as any)
    setLoading(false)
  }

  async function saveTestCase() {
    if (!form.title.trim())       return toast.error('Name is required')
    if (!form.project_id)         return toast.error('Select a project')
    if (!form.description.trim()) return toast.error('Google Sheet URL is required')
    const safeUrl = sanitizeUrl(form.description)
    if (!safeUrl) return toast.error('URL must start with http:// or https://')
    setSaving(true)
    const payload = {
      title:      form.title.trim(),
      project_id: form.project_id,
      description: safeUrl,
      status:     form.status,
      priority:   form.priority,
    }
    const { error } = await supabase.from('test_cases').insert([payload])
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
    const matchStatus  = filterStatus === 'all' || tc.status === filterStatus
    const matchProject = !filterProject || tc.project_id === filterProject
    const matchSearch  = tc.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchProject && matchSearch
  })

  const projectName = (id: string) => projects.find(p => p.id === id)?.name ?? 'Unknown'

  return (
    <div>
      <Header title="Test Cases" />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Stats row */}
        <div className="grid grid-cols-6 gap-3">
          {['all', ...STATUSES].map(s => {
            const count = s === 'all' ? testCases.length : testCases.filter(tc => tc.status === s).length
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={cn('glass-card p-3 text-center transition-all hover:border-white/[0.15]',
                  filterStatus === s ? 'border-violet-500/40 bg-violet-500/10' : '')}>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className={cn('text-[10px] font-medium capitalize mt-0.5',
                  s === 'pass' ? 'text-emerald-400' : s === 'fail' ? 'text-red-400' :
                  s === 'blocked' ? 'text-violet-400' : s === 'skipped' ? 'text-slate-400' :
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

        {/* List */}
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="glass-card h-14 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <ClipboardList size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No test cases found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(tc => {
              const sheetUrl   = tc.description   // URL stored in description field
              const safeTcUrl  = sanitizeUrl(sheetUrl)
              const embedTcUrl = sheetUrl ? getGoogleSheetsEmbedUrl(sheetUrl) : null
              return (
                <div key={tc.id} className="glass-card group">
                  <div className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{tc.title}</p>
                      <span className="text-xs text-slate-500">{projectName(tc.project_id)}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(safeTcUrl || embedTcUrl) && (
                        <button onClick={() => setViewUrl(sheetUrl!)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30 transition-colors">
                          <Eye size={11} /> Preview
                        </button>
                      )}
                      {safeTcUrl && (
                        <a href={safeTcUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 border border-slate-500/30 transition-colors">
                          <ExternalLink size={11} /> Open
                        </a>
                      )}
                      <select value={tc.status}
                        onChange={e => updateStatus(tc.id, e.target.value as any)}
                        className={cn('badge text-[10px] border cursor-pointer bg-transparent', STATUS_STYLES[tc.status])}>
                        {STATUSES.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                      </select>
                      <button onClick={() => deleteTC(tc.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Test Case Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-5">Add Test Case</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Login flow — happy path" className="input-field" autoFocus />
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
                <label className="label">Google Sheet URL *</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/d/..." className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => { setShowModal(false); setForm({ ...emptyForm, project_id: preselectedProject }) }}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={saveTestCase} disabled={saving}>
                {saving ? 'Saving...' : 'Save Test Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sheet preview modal */}
      {viewUrl && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#122240] border border-violet-100 dark:border-[#1a3355] rounded-2xl shadow-2xl w-full max-w-5xl h-[82vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100 dark:border-[#1a3355] flex-shrink-0">
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Sheet Preview</span>
              <div className="flex items-center gap-2">
                {sanitizeUrl(viewUrl) && (
                  <a href={sanitizeUrl(viewUrl)!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#1a3355] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1e3d66] border border-slate-200 dark:border-[#1a3355] transition-colors">
                    <ExternalLink size={12} /> Open in Sheets
                  </a>
                )}
                <button onClick={() => setViewUrl(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-violet-50 dark:hover:bg-[#1a3355] transition-colors">
                  <span className="text-slate-400 text-lg leading-none">×</span>
                </button>
              </div>
            </div>
            <div className="flex-shrink-0 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/30 px-4 py-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
              Sheet must be published to the web for preview to work. If it&apos;s private, use the Open button above.
            </div>
            <iframe
              src={getGoogleSheetsEmbedUrl(viewUrl) ?? sanitizeUrl(viewUrl) ?? ''}
              className="flex-1 w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
              title="Sheet Preview"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function TestCasesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /></div>}>
      <TestCasesContent />
    </Suspense>
  )
}
