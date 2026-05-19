'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  ArrowLeft, Plus, Link2, Key, FileText, StickyNote,
  Trash2, Eye, EyeOff, ExternalLink, ClipboardList, FileBarChart2, Edit2
} from 'lucide-react'
import { supabase, type Project, type ProjectResource, type TestCase, type TestReport } from '@/lib/supabase'
import { cn, getProjectGradient, formatDate, STATUS_STYLES, PRIORITY_STYLES } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

const RESOURCE_TYPES = [
  { value: 'link', label: 'Link', icon: Link2 },
  { value: 'credential', label: 'Credential', icon: Key },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'note', label: 'Note', icon: StickyNote },
]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [resources, setResources] = useState<ProjectResource[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [reports, setReports] = useState<TestReport[]>([])
  const [activeTab, setActiveTab] = useState<'resources' | 'test-cases' | 'reports'>('resources')
  const [loading, setLoading] = useState(true)
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [visibleCredentials, setVisibleCredentials] = useState<Set<string>>(new Set())

  const [resForm, setResForm] = useState({ type: 'link', title: '', value: '', is_sensitive: false })

  useEffect(() => { if (id) fetchData() }, [id])

  async function fetchData() {
    const [projRes, resRes, tcRes, repRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_resources').select('*').eq('project_id', id).order('created_at'),
      supabase.from('test_cases').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('test_reports').select('*').eq('project_id', id).order('test_date', { ascending: false }),
    ])
    if (projRes.data) setProject(projRes.data)
    if (resRes.data) setResources(resRes.data)
    if (tcRes.data) setTestCases(tcRes.data)
    if (repRes.data) setReports(repRes.data)
    setLoading(false)
  }

  async function addResource() {
    if (!resForm.title.trim()) return toast.error('Title is required')
    const { error } = await supabase.from('project_resources').insert([{ ...resForm, project_id: id }])
    if (error) return toast.error('Failed to add resource')
    toast.success('Resource added!')
    setShowResourceModal(false)
    setResForm({ type: 'link', title: '', value: '', is_sensitive: false })
    fetchData()
  }

  async function deleteResource(resId: string) {
    await supabase.from('project_resources').delete().eq('id', resId)
    toast.success('Resource deleted')
    fetchData()
  }

  function toggleCredential(resId: string) {
    setVisibleCredentials(prev => {
      const next = new Set(prev)
      next.has(resId) ? next.delete(resId) : next.add(resId)
      return next
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  )

  if (!project) return <div className="p-6 text-slate-400">Project not found.</div>

  const gradient = getProjectGradient(project.color)
  const tabs = [
    { key: 'resources', label: 'Resources', count: resources.length },
    { key: 'test-cases', label: 'Test Cases', count: testCases.length },
    { key: 'reports', label: 'Reports', count: reports.length },
  ]

  return (
    <div>
      <Header title={project.name} />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Back + Project header */}
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white mb-4 transition-colors">
            <ArrowLeft size={15} /> Back to Projects
          </button>

          <div className="glass-card p-6 relative overflow-hidden">
            <div className={cn('absolute top-0 left-0 w-1 h-full bg-gradient-to-b', gradient)} />
            <div className="pl-4">
              <div className="flex items-center gap-4 mb-2">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl shadow-lg', gradient)}>
                  {project.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{project.name}</h2>
                  <p className="text-sm text-slate-500">{project.description ?? 'No description'}</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-slate-500 mt-3">
                <span>Created {formatDate(project.created_at)}</span>
                <span className={cn('badge', project.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30')}>
                  {project.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                activeTab === tab.key
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              )}>
              {tab.label}
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full',
                activeTab === tab.key ? 'bg-violet-500/30 text-violet-300' : 'bg-white/[0.06] text-slate-500'
              )}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Project Resources</h3>
              <button className="btn-primary" onClick={() => setShowResourceModal(true)}>
                <Plus size={14} /> Add Resource
              </button>
            </div>

            {resources.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Link2 size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No resources added yet.</p>
                <p className="text-slate-600 text-xs mt-1">Add links, credentials, documents, and notes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resources.map(res => {
                  const TypeIcon = RESOURCE_TYPES.find(t => t.value === res.type)?.icon ?? Link2
                  const isVisible = visibleCredentials.has(res.id)
                  return (
                    <div key={res.id} className="glass-card p-4 group">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <TypeIcon size={14} className="text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white truncate">{res.title}</p>
                            <span className="text-[10px] bg-white/[0.06] text-slate-500 px-1.5 py-0.5 rounded-full capitalize">{res.type}</span>
                          </div>
                          {res.value && (
                            <p className={cn('text-xs break-all', res.is_sensitive && !isVisible ? 'blur-sm select-none' : 'text-slate-400')}>
                              {res.type === 'link' ? (
                                <a href={res.value} target="_blank" rel="noopener noreferrer"
                                  className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                                  {res.value} <ExternalLink size={10} />
                                </a>
                              ) : res.value}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {res.is_sensitive && (
                            <button onClick={() => toggleCredential(res.id)}
                              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                              {isVisible ? <EyeOff size={13} className="text-slate-400" /> : <Eye size={13} className="text-slate-400" />}
                            </button>
                          )}
                          <button onClick={() => deleteResource(res.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">
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
        )}

        {/* Test Cases Tab */}
        {activeTab === 'test-cases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Test Cases</h3>
              <Link href={`/test-cases?project=${id}`}>
                <button className="btn-primary"><Plus size={14} /> Add Test Case</button>
              </Link>
            </div>
            {testCases.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <ClipboardList size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No test cases yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {testCases.map(tc => (
                  <div key={tc.id} className="glass-card p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{tc.title}</p>
                      <p className="text-xs text-slate-500">{tc.category ?? 'Uncategorized'}</p>
                    </div>
                    <span className={cn('badge text-[10px]', STATUS_STYLES[tc.status])}>{tc.status}</span>
                    <span className={cn('badge text-[10px]', PRIORITY_STYLES[tc.priority])}>{tc.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Test Reports</h3>
              <Link href={`/reports?project=${id}`}>
                <button className="btn-primary"><Plus size={14} /> Add Report</button>
              </Link>
            </div>
            {reports.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <FileBarChart2 size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No reports yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(r => (
                  <div key={r.id} className="glass-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-white">{r.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(r.test_date)} · {r.environment ?? 'N/A'}</p>
                      </div>
                      <span className="text-xs text-slate-500">{r.total_cases} total</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {[
                        { label: 'Passed', val: r.passed, color: 'bg-emerald-500' },
                        { label: 'Failed', val: r.failed, color: 'bg-red-500' },
                        { label: 'Blocked', val: r.blocked, color: 'bg-orange-500' },
                        { label: 'Skipped', val: r.skipped, color: 'bg-slate-500' },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <div className={cn('text-lg font-bold', s.color.replace('bg-', 'text-'))}>{s.val}</div>
                          <div className="text-[10px] text-slate-500">{s.label}</div>
                        </div>
                      ))}
                      {r.bugs_found > 0 && (
                        <div className="ml-auto text-center">
                          <div className="text-lg font-bold text-pink-400">{r.bugs_found}</div>
                          <div className="text-[10px] text-slate-500">Bugs</div>
                        </div>
                      )}
                    </div>
                    {r.summary && <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-white/[0.05]">{r.summary}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-5">Add Resource</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {RESOURCE_TYPES.map(t => (
                    <button key={t.value} onClick={() => setResForm(f => ({ ...f, type: t.value }))}
                      className={cn('p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all',
                        resForm.type === t.value
                          ? 'border-violet-500/50 bg-violet-500/20 text-violet-300'
                          : 'border-white/[0.08] bg-white/[0.03] text-slate-500 hover:text-slate-300'
                      )}>
                      <t.icon size={14} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Title *</label>
                <input value={resForm.title} onChange={e => setResForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Staging URL" className="input-field" />
              </div>
              <div>
                <label className="label">Value / URL / Content</label>
                <textarea value={resForm.value} onChange={e => setResForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={resForm.type === 'link' ? 'https://...' : 'Content...'} rows={3}
                  className="input-field resize-none" />
              </div>
              {(resForm.type === 'credential') && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={resForm.is_sensitive}
                    onChange={e => setResForm(f => ({ ...f, is_sensitive: e.target.checked }))}
                    className="rounded" />
                  <span className="text-sm text-slate-400">Hide value (sensitive)</span>
                </label>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowResourceModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={addResource}>Add Resource</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
