'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  ArrowLeft, Plus, Lock, Globe, FileSpreadsheet, ClipboardList,
  FileBarChart2, Trash2, Eye, EyeOff, ExternalLink, Copy, X,
  ShieldCheck, AlertTriangle, Check,
} from 'lucide-react'
import {
  supabase,
  type Project,
  type ProjectCredential,
  type ProjectUrl,
  type ProjectSheet,
  type TestCase,
  type TestReport,
} from '@/lib/supabase'
import { cn, getProjectGradient, formatDate, STATUS_STYLES, PRIORITY_STYLES } from '@/lib/utils'
import { sanitizeUrl, getGoogleSheetsEmbedUrl } from '@/lib/security'
import Link from 'next/link'
import toast from 'react-hot-toast'

// ── Constants ──────────────────────────────────────────────────────────────

const ENV_CONFIG = {
  dev:        { label: 'DEV',        cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30' },
  staging:    { label: 'STAGING',    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30' },
  production: { label: 'PROD',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' },
  qa:         { label: 'QA',         cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30' },
  custom:     { label: 'CUSTOM',     cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30' },
} as const

const SHEET_TYPE_CONFIG = {
  test_cases: { label: 'Test Cases', cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30' },
  rtm:        { label: 'RTM',        cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30' },
  regression: { label: 'Regression', cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30' },
  smoke:      { label: 'Smoke',      cls: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30' },
  other:      { label: 'Other',      cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30' },
} as const

// ── Main component ─────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [project,     setProject]     = useState<Project | null>(null)
  const [credentials, setCredentials] = useState<ProjectCredential[]>([])
  const [projectUrls, setProjectUrls] = useState<ProjectUrl[]>([])
  const [sheets,      setSheets]      = useState<ProjectSheet[]>([])
  const [testCases,   setTestCases]   = useState<TestCase[]>([])
  const [reports,     setReports]     = useState<TestReport[]>([])
  const [loading,     setLoading]     = useState(true)

  // Visible credential passwords (stored by id)
  const [visibleCreds, setVisibleCreds] = useState<Set<string>>(new Set())
  // Copied state for copy buttons
  const [copied, setCopied] = useState<string | null>(null)

  // Sheet iframe viewer
  const [viewSheetUrl, setViewSheetUrl] = useState<string | null>(null)

  // Modals
  const [showCredModal,  setShowCredModal]  = useState(false)
  const [showUrlModal,   setShowUrlModal]   = useState(false)
  const [showSheetModal, setShowSheetModal] = useState(false)
  const [saving,         setSaving]         = useState(false)

  // Forms
  const [credForm,  setCredForm]  = useState({ title: '', username: '', password: '', url: '', notes: '' })
  const [urlForm,   setUrlForm]   = useState({ label: '', url: '', env: 'dev' as ProjectUrl['env'] })
  const [sheetForm, setSheetForm] = useState({ title: '', url: '', type: 'test_cases' as ProjectSheet['type'] })

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!id) return
    const [projRes, credRes, urlRes, sheetRes, tcRes, repRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_credentials').select('*').eq('project_id', id).order('created_at'),
      supabase.from('project_urls').select('*').eq('project_id', id).order('env').order('created_at'),
      supabase.from('project_sheets').select('*').eq('project_id', id).order('type').order('created_at'),
      supabase.from('test_cases').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(5),
      supabase.from('test_reports').select('*').eq('project_id', id).order('test_date', { ascending: false }).limit(3),
    ])
    if (projRes.data)  setProject(projRes.data)
    if (credRes.data)  setCredentials(credRes.data)
    if (urlRes.data)   setProjectUrls(urlRes.data)
    if (sheetRes.data) setSheets(sheetRes.data)
    if (tcRes.data)    setTestCases(tcRes.data)
    if (repRes.data)   setReports(repRes.data)
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Helpers ──────────────────────────────────────────────────────────────

  function toggleCredVisible(credId: string) {
    setVisibleCreds(prev => {
      const next = new Set(prev)
      next.has(credId) ? next.delete(credId) : next.add(credId)
      return next
    })
  }

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error('Copy failed')
    }
  }

  function closeCredModal() {
    setShowCredModal(false)
    setCredForm({ title: '', username: '', password: '', url: '', notes: '' })
  }
  function closeUrlModal() {
    setShowUrlModal(false)
    setUrlForm({ label: '', url: '', env: 'dev' })
  }
  function closeSheetModal() {
    setShowSheetModal(false)
    setSheetForm({ title: '', url: '', type: 'test_cases' })
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async function addCredential() {
    if (!credForm.title.trim()) return toast.error('Title is required')
    setSaving(true)
    const payload = {
      project_id: id,
      title:    credForm.title.trim(),
      username: credForm.username.trim() || null,
      password: credForm.password || null,
      url:      sanitizeUrl(credForm.url) ?? null,
      notes:    credForm.notes.trim() || null,
    }
    const { error } = await supabase.from('project_credentials').insert([payload])
    setSaving(false)
    if (error) return toast.error(error.message || 'Failed to save credential')
    toast.success('Credential saved!')
    closeCredModal()
    fetchData()
  }

  async function deleteCredential(credId: string) {
    await supabase.from('project_credentials').delete().eq('id', credId)
    toast.success('Credential deleted')
    setCredentials(prev => prev.filter(c => c.id !== credId))
  }

  async function addUrl() {
    if (!urlForm.label.trim()) return toast.error('Label is required')
    if (!urlForm.url.trim())   return toast.error('URL is required')
    const safeUrl = sanitizeUrl(urlForm.url)
    if (!safeUrl) return toast.error('URL must start with http:// or https://')
    setSaving(true)
    const { error } = await supabase.from('project_urls').insert([{
      project_id: id, label: urlForm.label.trim(), url: safeUrl, env: urlForm.env,
    }])
    setSaving(false)
    if (error) return toast.error(error.message || 'Failed to save URL')
    toast.success('URL saved!')
    closeUrlModal()
    fetchData()
  }

  async function deleteUrl(urlId: string) {
    await supabase.from('project_urls').delete().eq('id', urlId)
    toast.success('URL deleted')
    setProjectUrls(prev => prev.filter(u => u.id !== urlId))
  }

  async function addSheet() {
    if (!sheetForm.title.trim()) return toast.error('Title is required')
    if (!sheetForm.url.trim())   return toast.error('URL is required')
    const safeUrl = sanitizeUrl(sheetForm.url)
    if (!safeUrl) return toast.error('URL must start with http:// or https://')
    setSaving(true)
    const { error } = await supabase.from('project_sheets').insert([{
      project_id: id, title: sheetForm.title.trim(), url: safeUrl, type: sheetForm.type,
    }])
    setSaving(false)
    if (error) return toast.error(error.message || 'Failed to save sheet link')
    toast.success('Sheet link saved!')
    closeSheetModal()
    fetchData()
  }

  async function deleteSheet(sheetId: string) {
    await supabase.from('project_sheets').delete().eq('id', sheetId)
    toast.success('Sheet removed')
    setSheets(prev => prev.filter(s => s.id !== sheetId))
  }

  // ── Loading / not found ──────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
    </div>
  )

  if (!project) return (
    <div className="p-8 text-center text-slate-400">Project not found.</div>
  )

  const gradient = getProjectGradient(project.color)

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <Header title={project.name} />

      <div className="p-6 space-y-5 animate-fade-in">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Projects
        </button>

        {/* ── Project header card ─────────────────────────────────────── */}
        <div className="card p-5 relative overflow-hidden">
          <div className={cn('absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b', gradient)} />
          <div className="pl-4 flex items-start gap-4">
            <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0', gradient)}>
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">{project.name}</h2>
                <span className={cn('badge text-[10px]',
                  project.status === 'active'    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' :
                  project.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30' :
                                                   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                )}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {project.description ?? 'No description added.'}
              </p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {[
                  { n: credentials.length, label: 'credentials' },
                  { n: projectUrls.length, label: 'URLs' },
                  { n: sheets.length,      label: 'sheets' },
                  { n: testCases.length,   label: 'test cases' },
                  { n: reports.length,     label: 'reports' },
                ].map(({ n, label }) => (
                  <span key={label} className="text-xs text-slate-400 dark:text-slate-500">
                    <strong className="text-slate-700 dark:text-slate-300 font-bold">{n}</strong> {label}
                  </span>
                ))}
                <span className="text-xs text-slate-400 dark:text-slate-600 ml-auto">
                  Created {formatDate(project.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Credentials ────────────────────────────────────────────── */}
        <Section
          icon={<Lock size={15} className="text-orange-500" />}
          title="Credentials"
          count={credentials.length}
          onAdd={() => setShowCredModal(true)}
          addLabel="Add Credential"
          badge={
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full">
              <ShieldCheck size={10} /> AES-256 + TLS
            </span>
          }
        >
          {credentials.length === 0 ? (
            <EmptyState icon={<Lock size={28} />} message="No credentials yet." sub="Store login details securely." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {credentials.map(cred => {
                const isVisible = visibleCreds.has(cred.id)
                const safeCredUrl = sanitizeUrl(cred.url)
                return (
                  <div key={cred.id} className="card p-4">
                    {/* Card header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                          <Lock size={13} className="text-orange-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{cred.title}</p>
                      </div>
                      <button
                        onClick={() => deleteCredential(cred.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0 ml-2"
                        title="Delete credential"
                      >
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>

                    {/* Rows */}
                    <div className="space-y-2">
                      {cred.username && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0c2040]/60 rounded-xl px-3 py-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 w-7 flex-shrink-0">Email</span>
                          <span className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 truncate">{cred.username}</span>
                          <button
                            onClick={() => copyText(cred.username!, `u-${cred.id}`)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#122240] border border-orange-100 dark:border-[#1a3355] text-slate-500 dark:text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-all flex-shrink-0"
                            title="Copy email"
                          >
                            {copied === `u-${cred.id}` ? <><Check size={10} className="text-emerald-500" /> Copied</> : <><Copy size={10} /> Copy</>}
                          </button>
                        </div>
                      )}

                      {cred.password !== null && cred.password !== '' && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0c2040]/60 rounded-xl px-3 py-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 w-7 flex-shrink-0">Pass</span>
                          <span className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 truncate select-none">
                            {isVisible ? cred.password : '●●●●●●●●'}
                          </span>
                          <button
                            onClick={() => toggleCredVisible(cred.id)}
                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#122240] transition-colors flex-shrink-0"
                            title={isVisible ? 'Hide' : 'Show'}
                          >
                            {isVisible
                              ? <EyeOff size={12} className="text-orange-400" />
                              : <Eye size={12} className="text-slate-400 hover:text-orange-400" />}
                          </button>
                          <button
                            onClick={() => copyText(cred.password!, `p-${cred.id}`)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#122240] border border-orange-100 dark:border-[#1a3355] text-slate-500 dark:text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-all flex-shrink-0"
                            title="Copy password"
                          >
                            {copied === `p-${cred.id}` ? <><Check size={10} className="text-emerald-500" /> Copied</> : <><Copy size={10} /> Copy</>}
                          </button>
                        </div>
                      )}

                      {safeCredUrl && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0c2040]/60 rounded-xl px-3 py-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 w-7 flex-shrink-0">URL</span>
                          <span className="flex-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">{cred.url}</span>
                          <button
                            onClick={() => copyText(cred.url!, `uc-${cred.id}`)}
                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#122240] transition-colors flex-shrink-0"
                            title="Copy URL"
                          >
                            {copied === `uc-${cred.id}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                          </button>
                          <a
                            href={safeCredUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-500 hover:bg-orange-400 text-white transition-colors flex-shrink-0"
                            title="Open in new tab"
                          >
                            Go <ExternalLink size={10} />
                          </a>
                        </div>
                      )}

                      {cred.notes && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 px-1 pt-0.5 line-clamp-2">{cred.notes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* ── Environment URLs ────────────────────────────────────────── */}
        <Section
          icon={<Globe size={15} className="text-orange-500" />}
          title="Environment URLs"
          count={projectUrls.length}
          onAdd={() => setShowUrlModal(true)}
          addLabel="Add URL"
        >
          {projectUrls.length === 0 ? (
            <EmptyState icon={<Globe size={28} />} message="No URLs added yet." sub="Add dev, staging, and production links." />
          ) : (
            <div className="space-y-2">
              {projectUrls.map(pu => {
                const env = ENV_CONFIG[pu.env] ?? ENV_CONFIG.custom
                const safeUrl = sanitizeUrl(pu.url)
                return (
                  <div key={pu.id} className="flex items-center gap-3 p-3 rounded-xl border border-orange-50 dark:border-[#1a3355] bg-orange-50/40 dark:bg-[#0c2040]/40 group">
                    <span className={cn('badge text-[10px] font-bold flex-shrink-0', env.cls)}>
                      {env.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{pu.label}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-mono">{pu.url}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyText(pu.url, `url-${pu.id}`)}
                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#1a3355] transition-colors"
                        title="Copy URL"
                      >
                        {copied === `url-${pu.id}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} className="text-slate-400" />}
                      </button>
                      {safeUrl && (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#1a3355] transition-colors"
                          title="Open URL"
                        >
                          <ExternalLink size={13} className="text-orange-500" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteUrl(pu.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete URL"
                      >
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* ── Test Sheets & RTM ───────────────────────────────────────── */}
        <Section
          icon={<FileSpreadsheet size={15} className="text-orange-500" />}
          title="Test Sheets & RTM"
          count={sheets.length}
          onAdd={() => setShowSheetModal(true)}
          addLabel="Add Sheet"
        >
          {sheets.length === 0 ? (
            <EmptyState icon={<FileSpreadsheet size={28} />} message="No sheets linked yet." sub="Add Google Sheets for test cases, RTM, regression, and more." />
          ) : (
            <div className="space-y-2">
              {sheets.map(sheet => {
                const type   = SHEET_TYPE_CONFIG[sheet.type] ?? SHEET_TYPE_CONFIG.other
                const safeUrl = sanitizeUrl(sheet.url)
                const embedUrl = getGoogleSheetsEmbedUrl(sheet.url)
                return (
                  <div key={sheet.id} className="flex items-center gap-3 p-3 rounded-xl border border-orange-50 dark:border-[#1a3355] bg-orange-50/40 dark:bg-[#0c2040]/40 group">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet size={14} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{sheet.title}</p>
                      <span className={cn('badge text-[10px] mt-0.5', type.cls)}>{type.label}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(safeUrl || embedUrl) && (
                        <button
                          onClick={() => setViewSheetUrl(sheet.url)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors border border-orange-200 dark:border-orange-500/30"
                        >
                          <Eye size={11} /> View
                        </button>
                      )}
                      {safeUrl && (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-[#1a3355] transition-all"
                          title="Open in new tab"
                        >
                          <ExternalLink size={13} className="text-orange-500" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteSheet(sheet.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                        title="Remove sheet"
                      >
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* ── Test Cases preview ──────────────────────────────────────── */}
        <Section
          icon={<ClipboardList size={15} className="text-orange-500" />}
          title="Test Cases"
          count={testCases.length}
          actionEl={
            <Link href={`/test-cases?project=${id}`}>
              <button className="btn-primary py-1.5 px-3 text-xs">
                <Plus size={13} /> Add Test Case
              </button>
            </Link>
          }
          footerEl={
            <Link href={`/test-cases?project=${id}`} className="text-xs text-orange-500 hover:text-orange-400 font-medium transition-colors">
              View all test cases →
            </Link>
          }
        >
          {testCases.length === 0 ? (
            <EmptyState icon={<ClipboardList size={28} />} message="No test cases yet." />
          ) : (
            <div className="space-y-2">
              {testCases.map(tc => (
                <div key={tc.id} className="flex items-center gap-3 p-3 rounded-xl border border-orange-50 dark:border-[#1a3355] bg-orange-50/30 dark:bg-[#0c2040]/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{tc.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{tc.category ?? 'Uncategorized'}</p>
                  </div>
                  <span className={cn('badge text-[10px]', STATUS_STYLES[tc.status])}>{tc.status}</span>
                  <span className={cn('badge text-[10px]', PRIORITY_STYLES[tc.priority])}>{tc.priority}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Reports preview ─────────────────────────────────────────── */}
        <Section
          icon={<FileBarChart2 size={15} className="text-orange-500" />}
          title="Test Reports"
          count={reports.length}
          actionEl={
            <Link href={`/reports?project=${id}`}>
              <button className="btn-primary py-1.5 px-3 text-xs">
                <Plus size={13} /> Add Report
              </button>
            </Link>
          }
          footerEl={
            <Link href={`/reports?project=${id}`} className="text-xs text-orange-500 hover:text-orange-400 font-medium transition-colors">
              View all reports →
            </Link>
          }
        >
          {reports.length === 0 ? (
            <EmptyState icon={<FileBarChart2 size={28} />} message="No reports yet." />
          ) : (
            <div className="space-y-3">
              {reports.map(r => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{r.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatDate(r.test_date)} · {r.environment ?? 'N/A'}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">{r.total_cases} total</span>
                  </div>
                  <div className="flex items-center gap-5">
                    {[
                      { label: 'Passed',  val: r.passed,  cls: 'text-emerald-500 dark:text-emerald-400' },
                      { label: 'Failed',  val: r.failed,  cls: 'text-red-500 dark:text-red-400' },
                      { label: 'Blocked', val: r.blocked, cls: 'text-orange-500 dark:text-orange-400' },
                      { label: 'Skipped', val: r.skipped, cls: 'text-slate-400' },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className={cn('text-base font-black', s.cls)}>{s.val}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{s.label}</div>
                      </div>
                    ))}
                    {r.bugs_found > 0 && (
                      <div className="ml-auto text-center">
                        <div className="text-base font-black text-pink-500 dark:text-pink-400">{r.bugs_found}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Bugs</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ── Sheet viewer modal ─────────────────────────────────────────── */}
      {viewSheetUrl && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#122240] border border-orange-100 dark:border-[#1a3355] rounded-2xl shadow-2xl w-full max-w-5xl h-[82vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100 dark:border-[#1a3355] flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={15} className="text-orange-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Sheet Preview</span>
              </div>
              <div className="flex items-center gap-2">
                {sanitizeUrl(viewSheetUrl) && (
                  <a
                    href={sanitizeUrl(viewSheetUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <ExternalLink size={12} /> Open in Sheets
                  </a>
                )}
                <button
                  onClick={() => setViewSheetUrl(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-orange-50 dark:hover:bg-[#1a3355] transition-colors"
                >
                  <X size={15} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="flex-shrink-0 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/30 px-4 py-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle size={12} />
              Sheet must be published to the web for the preview to work.&nbsp;
              <a
                href="https://support.google.com/docs/answer/37579"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                How to publish →
              </a>
            </div>
            <iframe
              src={getGoogleSheetsEmbedUrl(viewSheetUrl) ?? sanitizeUrl(viewSheetUrl) ?? ''}
              className="flex-1 w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
              title="Sheet Preview"
            />
          </div>
        </div>
      )}

      {/* ── Add Credential modal ───────────────────────────────────────── */}
      {showCredModal && (
        <Modal title="Add Credential" sub="Stored with AES-256 + TLS encryption" onClose={closeCredModal}>
          <div className="space-y-3">
            <Field label="Title *">
              <input value={credForm.title} onChange={e => setCredForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Admin Login" className="input-field" autoFocus />
            </Field>
            <Field label="Username / Email">
              <input value={credForm.username} onChange={e => setCredForm(f => ({ ...f, username: e.target.value }))}
                placeholder="admin@example.com" className="input-field" autoComplete="off" />
            </Field>
            <Field label="Password">
              <input value={credForm.password} onChange={e => setCredForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" type="password" className="input-field" autoComplete="new-password" />
            </Field>
            <Field label="URL (optional)">
              <input value={credForm.url} onChange={e => setCredForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://app.example.com/login" className="input-field" />
            </Field>
            <Field label="Notes (optional)">
              <textarea value={credForm.notes} onChange={e => setCredForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..." rows={2} className="input-field resize-none" />
            </Field>
          </div>
          <ModalFooter onCancel={closeCredModal} onSave={addCredential} saving={saving} saveLabel="Save Credential" />
        </Modal>
      )}

      {/* ── Add URL modal ──────────────────────────────────────────────── */}
      {showUrlModal && (
        <Modal title="Add Environment URL" onClose={closeUrlModal}>
          <div className="space-y-3">
            <Field label="Environment">
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(ENV_CONFIG) as Array<keyof typeof ENV_CONFIG>).map(env => (
                  <button key={env}
                    onClick={() => setUrlForm(f => ({ ...f, env }))}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                      urlForm.env === env
                        ? cn(ENV_CONFIG[env].cls, 'scale-105')
                        : 'border-slate-200 dark:border-[#1a3355] text-slate-500 dark:text-slate-400 hover:border-orange-200 dark:hover:border-orange-500/40'
                    )}
                  >
                    {ENV_CONFIG[env].label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Label *">
              <input value={urlForm.label} onChange={e => setUrlForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Web App, API, Admin Panel" className="input-field" autoFocus />
            </Field>
            <Field label="URL *">
              <input value={urlForm.url} onChange={e => setUrlForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://..." className="input-field" />
            </Field>
          </div>
          <ModalFooter onCancel={closeUrlModal} onSave={addUrl} saving={saving} saveLabel="Save URL" />
        </Modal>
      )}

      {/* ── Add Sheet modal ────────────────────────────────────────────── */}
      {showSheetModal && (
        <Modal title="Add Sheet / Document Link" onClose={closeSheetModal}>
          <div className="space-y-3">
            <Field label="Type">
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(SHEET_TYPE_CONFIG) as Array<keyof typeof SHEET_TYPE_CONFIG>).map(t => (
                  <button key={t}
                    onClick={() => setSheetForm(f => ({ ...f, type: t }))}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                      sheetForm.type === t
                        ? cn(SHEET_TYPE_CONFIG[t].cls, 'scale-105')
                        : 'border-slate-200 dark:border-[#1a3355] text-slate-500 dark:text-slate-400 hover:border-orange-200 dark:hover:border-orange-500/40'
                    )}
                  >
                    {SHEET_TYPE_CONFIG[t].label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Title *">
              <input value={sheetForm.title} onChange={e => setSheetForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Sprint 3 Test Cases" className="input-field" autoFocus />
            </Field>
            <Field label="Google Sheets URL *">
              <input value={sheetForm.url} onChange={e => setSheetForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://docs.google.com/spreadsheets/d/..." className="input-field" />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                For the in-app preview to work, the sheet must be published: File → Share → Publish to web.
              </p>
            </Field>
          </div>
          <ModalFooter onCancel={closeSheetModal} onSave={addSheet} saving={saving} saveLabel="Save Sheet" />
        </Modal>
      )}
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────

function Section({
  icon, title, count, onAdd, addLabel, actionEl, badge, footerEl, children,
}: {
  icon: React.ReactNode
  title: string
  count: number
  onAdd?: () => void
  addLabel?: string
  actionEl?: React.ReactNode
  badge?: React.ReactNode
  footerEl?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
            {icon}
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1a3355] text-slate-500 dark:text-slate-400">
            {count}
          </span>
          {badge}
        </div>
        {actionEl ?? (onAdd && (
          <button onClick={onAdd} className="btn-primary py-1.5 px-3 text-xs flex-shrink-0">
            <Plus size={13} /> {addLabel ?? 'Add'}
          </button>
        ))}
      </div>

      {children}

      {footerEl && (
        <div className="pt-1 border-t border-orange-50 dark:border-[#1a3355]">
          {footerEl}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, message, sub }: { icon: React.ReactNode; message: string; sub?: string }) {
  return (
    <div className="py-10 text-center">
      <div className="text-slate-200 dark:text-slate-700 flex justify-center mb-3">{icon}</div>
      <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{message}</p>
      {sub && <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">{sub}</p>}
    </div>
  )
}

function Modal({
  title, sub, onClose, children,
}: {
  title: string
  sub?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#122240] border border-orange-100 dark:border-[#1a3355] rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-orange-50 dark:border-[#1a3355]">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-orange-50 dark:hover:bg-[#1a3355] transition-colors"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function ModalFooter({
  onCancel, onSave, saving, saveLabel,
}: {
  onCancel: () => void
  onSave: () => void
  saving: boolean
  saveLabel: string
}) {
  return (
    <div className="flex gap-3 mt-5">
      <button className="btn-secondary flex-1 justify-center" onClick={onCancel}>Cancel</button>
      <button className="btn-primary flex-1 justify-center" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : saveLabel}
      </button>
    </div>
  )
}
