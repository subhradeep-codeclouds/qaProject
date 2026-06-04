'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  ArrowLeft, Plus, Lock, Globe, FileSpreadsheet, ClipboardList,
  FileBarChart2, Trash2, Eye, EyeOff, ExternalLink, Copy, X,
  ShieldCheck, AlertTriangle, Check, Pencil, StickyNote,
  Paperclip, Upload, Download, Video, FileText, CalendarDays,
  ImageIcon, File as FileIcon,
} from 'lucide-react'
import {
  supabase,
  type Project,
  type ProjectCredential,
  type ProjectUrl,
  type ProjectSheet,
  type TestCase,
  type TestReport,
  type ProjectNote,
  type ProjectAttachment,
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
  regression: { label: 'Regression', cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30' },
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
  const [notes,       setNotes]       = useState<ProjectNote[]>([])
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([])
  const [uploading,   setUploading]   = useState(false)
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
  const [showNoteModal,  setShowNoteModal]  = useState(false)
  const [saving,         setSaving]         = useState(false)

  // Forms
  const [credForm,  setCredForm]  = useState({ title: '', username: '', password: '', url: '', notes: '' })
  const [urlForm,   setUrlForm]   = useState({ label: '', url: '', env: 'dev' as ProjectUrl['env'] })
  const [sheetForm, setSheetForm] = useState({ title: '', url: '', type: 'test_cases' as ProjectSheet['type'] })
  const [noteForm,  setNoteForm]  = useState({ title: '', date: new Date().toISOString().slice(0, 10), note: '' })

  // Edit tracking — null = add mode, string = edit mode (the item's id)
  const [editingCredId,  setEditingCredId]  = useState<string | null>(null)
  const [editingUrlId,   setEditingUrlId]   = useState<string | null>(null)
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null)
  const [editingNoteId,  setEditingNoteId]  = useState<string | null>(null)

  // Notes expand/collapse
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!id) return
    const [projRes, credRes, urlRes, sheetRes, tcRes, repRes, noteRes, attRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_credentials').select('*').eq('project_id', id).order('created_at'),
      supabase.from('project_urls').select('*').eq('project_id', id).order('env').order('created_at'),
      supabase.from('project_sheets').select('*').eq('project_id', id).order('type').order('created_at'),
      supabase.from('test_cases').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(5),
      supabase.from('test_reports').select('*').eq('project_id', id).order('test_date', { ascending: false }).limit(3),
      supabase.from('project_notes').select('*').eq('project_id', id).order('date', { ascending: false }),
      supabase.from('project_attachments').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ])
    if (projRes.data)  setProject(projRes.data)
    if (credRes.data)  setCredentials(credRes.data)
    if (urlRes.data)   setProjectUrls(urlRes.data)
    if (sheetRes.data) setSheets(sheetRes.data)
    if (tcRes.data)    setTestCases(tcRes.data)
    if (repRes.data)   setReports(repRes.data)
    if (noteRes.data)  setNotes(noteRes.data)
    if (attRes.data)   setAttachments(attRes.data)
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
    setEditingCredId(null)
    setCredForm({ title: '', username: '', password: '', url: '', notes: '' })
  }
  function closeUrlModal() {
    setShowUrlModal(false)
    setEditingUrlId(null)
    setUrlForm({ label: '', url: '', env: 'dev' })
  }
  function closeSheetModal() {
    setShowSheetModal(false)
    setEditingSheetId(null)
    setSheetForm({ title: '', url: '', type: 'test_cases' })
  }
  function closeNoteModal() {
    setShowNoteModal(false)
    setEditingNoteId(null)
    setNoteForm({ title: '', date: new Date().toISOString().slice(0, 10), note: '' })
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  // ── Credential CRUD ──────────────────────────────────────────────────────

  function openEditCred(cred: ProjectCredential) {
    setCredForm({
      title:    cred.title,
      username: cred.username ?? '',
      password: cred.password ?? '',
      url:      cred.url ?? '',
      notes:    cred.notes ?? '',
    })
    setEditingCredId(cred.id)
    setShowCredModal(true)
  }

  async function saveCred() {
    if (!credForm.title.trim()) return toast.error('Title is required')
    setSaving(true)
    const payload = {
      title:    credForm.title.trim(),
      username: credForm.username.trim() || null,
      password: credForm.password || null,
      url:      sanitizeUrl(credForm.url) ?? null,
      notes:    credForm.notes.trim() || null,
    }
    const { error } = editingCredId
      ? await supabase.from('project_credentials').update(payload).eq('id', editingCredId)
      : await supabase.from('project_credentials').insert([{ ...payload, project_id: id }])
    setSaving(false)
    if (error) return toast.error(error.message || 'Failed to save credential')
    toast.success(editingCredId ? 'Credential updated!' : 'Credential saved!')
    closeCredModal()
    fetchData()
  }

  async function deleteCredential(credId: string) {
    await supabase.from('project_credentials').delete().eq('id', credId)
    toast.success('Credential deleted')
    setCredentials(prev => prev.filter(c => c.id !== credId))
  }

  // ── URL CRUD ─────────────────────────────────────────────────────────────

  function openEditUrl(pu: ProjectUrl) {
    setUrlForm({ label: pu.label, url: pu.url, env: pu.env })
    setEditingUrlId(pu.id)
    setShowUrlModal(true)
  }

  async function saveUrl() {
    if (!urlForm.label.trim()) return toast.error('Label is required')
    if (!urlForm.url.trim())   return toast.error('URL is required')
    const safeUrl = sanitizeUrl(urlForm.url)
    if (!safeUrl) return toast.error('URL must start with http:// or https://')
    setSaving(true)
    const payload = { label: urlForm.label.trim(), url: safeUrl, env: urlForm.env }
    const { error } = editingUrlId
      ? await supabase.from('project_urls').update(payload).eq('id', editingUrlId)
      : await supabase.from('project_urls').insert([{ ...payload, project_id: id }])
    setSaving(false)
    if (error) return toast.error(error.message || 'Failed to save URL')
    toast.success(editingUrlId ? 'URL updated!' : 'URL saved!')
    closeUrlModal()
    fetchData()
  }

  async function deleteUrl(urlId: string) {
    await supabase.from('project_urls').delete().eq('id', urlId)
    toast.success('URL deleted')
    setProjectUrls(prev => prev.filter(u => u.id !== urlId))
  }

  // ── Sheet CRUD ───────────────────────────────────────────────────────────

  function openEditSheet(sheet: ProjectSheet) {
    setSheetForm({ title: sheet.title, url: sheet.url, type: sheet.type })
    setEditingSheetId(sheet.id)
    setShowSheetModal(true)
  }

  async function saveSheet() {
    if (!sheetForm.title.trim()) return toast.error('Title is required')
    if (!sheetForm.url.trim())   return toast.error('URL is required')
    const safeUrl = sanitizeUrl(sheetForm.url)
    if (!safeUrl) return toast.error('URL must start with http:// or https://')
    setSaving(true)
    const payload = { title: sheetForm.title.trim(), url: safeUrl, type: sheetForm.type }
    const { error } = editingSheetId
      ? await supabase.from('project_sheets').update(payload).eq('id', editingSheetId)
      : await supabase.from('project_sheets').insert([{ ...payload, project_id: id }])
    setSaving(false)
    if (error) return toast.error(error.message || 'Failed to save sheet link')
    toast.success(editingSheetId ? 'Sheet updated!' : 'Sheet saved!')
    closeSheetModal()
    fetchData()
  }

  async function deleteSheet(sheetId: string) {
    await supabase.from('project_sheets').delete().eq('id', sheetId)
    toast.success('Sheet removed')
    setSheets(prev => prev.filter(s => s.id !== sheetId))
  }

  // ── Note CRUD ────────────────────────────────────────────────────────────

  function openEditNote(note: ProjectNote) {
    setNoteForm({ title: note.title, date: note.date, note: note.note ?? '' })
    setEditingNoteId(note.id)
    setShowNoteModal(true)
  }

  async function saveNote() {
    if (!noteForm.title.trim()) return toast.error('Title is required')
    if (!noteForm.date)         return toast.error('Date is required')
    setSaving(true)
    const payload = {
      title: noteForm.title.trim(),
      date:  noteForm.date,
      note:  noteForm.note.trim() || null,
    }
    const { error } = editingNoteId
      ? await supabase.from('project_notes').update(payload).eq('id', editingNoteId)
      : await supabase.from('project_notes').insert([{ ...payload, project_id: id }])
    setSaving(false)
    if (error) return toast.error(error.message || 'Failed to save note')
    toast.success(editingNoteId ? 'Note updated!' : 'Note saved!')
    closeNoteModal()
    fetchData()
  }

  async function deleteNote(noteId: string) {
    await supabase.from('project_notes').delete().eq('id', noteId)
    toast.success('Note deleted')
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  // ── Attachment CRUD ──────────────────────────────────────────────────────

  async function uploadAttachments(files: FileList) {
    setUploading(true)
    let successCount = 0
    await Promise.all(Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', id)
      const res = await fetch('/api/attachments/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) toast.error(`Upload failed: ${data.error ?? file.name}`)
      else successCount++
    }))
    setUploading(false)
    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded!`)
      fetchData()
    }
  }

  async function downloadAttachment(att: ProjectAttachment) {
    const toastId = toast.loading(`Downloading ${att.name}…`)
    const res = await fetch('/api/attachments/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath: att.storage_path }),
    })
    toast.dismiss(toastId)
    if (!res.ok) return toast.error('Download failed')
    const { signedUrl } = await res.json()
    const a = document.createElement('a')
    a.href = signedUrl; a.download = att.name
    document.body.appendChild(a); a.click()
    document.body.removeChild(a)
  }

  async function deleteAttachment(att: ProjectAttachment) {
    const res = await fetch('/api/attachments/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: att.id, storagePath: att.storage_path }),
    })
    if (!res.ok) { toast.error('Delete failed'); return }
    toast.success('File deleted')
    setAttachments(prev => prev.filter(a => a.id !== att.id))
  }

  // ── Loading / not found ──────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
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
                  { n: notes.length,       label: 'notes' },
                  { n: attachments.length, label: 'files' },
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
          icon={<Lock size={15} className="text-violet-500" />}
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
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[580px]">
                <thead>
                  <tr className="border-b border-violet-100 dark:border-[#1a3355]">
                    {['Title', 'Email / Username', 'Password', 'URL', ''].map(h => (
                      <th key={h} className="text-left text-[10px] uppercase font-bold tracking-wide text-slate-400 dark:text-slate-500 py-2 px-3 last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {credentials.map(cred => {
                    const isVisible   = visibleCreds.has(cred.id)
                    const safeCredUrl = sanitizeUrl(cred.url)
                    return (
                      <tr key={cred.id} className="border-b border-violet-50 dark:border-[#1a3355]/40 hover:bg-violet-50/50 dark:hover:bg-[#0c2040]/50 transition-colors group">

                        {/* Title + notes */}
                        <td className="py-2.5 px-3 w-[22%]">
                          <div className="flex items-center gap-1.5">
                            <Lock size={11} className="text-violet-400 flex-shrink-0" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">{cred.title}</span>
                          </div>
                          {cred.notes && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 ml-4">{cred.notes}</p>
                          )}
                        </td>

                        {/* Username */}
                        <td className="py-2.5 px-3 w-[26%]">
                          {cred.username ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{cred.username}</span>
                              <button onClick={() => copyText(cred.username!, `u-${cred.id}`)}
                                className="p-1 rounded hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                title="Copy email">
                                {copied === `u-${cred.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-slate-400" />}
                              </button>
                            </div>
                          ) : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                        </td>

                        {/* Password */}
                        <td className="py-2.5 px-3 w-[24%]">
                          {cred.password ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs text-slate-600 dark:text-slate-300 select-none">
                                {isVisible ? cred.password : '●●●●●●●●'}
                              </span>
                              <button onClick={() => toggleCredVisible(cred.id)}
                                className="p-1 rounded hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors flex-shrink-0"
                                title={isVisible ? 'Hide' : 'Show'}>
                                {isVisible ? <EyeOff size={10} className="text-violet-400" /> : <Eye size={10} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />}
                              </button>
                              <button onClick={() => copyText(cred.password!, `p-${cred.id}`)}
                                className="p-1 rounded hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                title="Copy password">
                                {copied === `p-${cred.id}` ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-slate-400" />}
                              </button>
                            </div>
                          ) : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                        </td>

                        {/* URL / Go button */}
                        <td className="py-2.5 px-3 w-[14%]">
                          {safeCredUrl ? (
                            <a href={safeCredUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-500 hover:bg-violet-400 text-white transition-colors">
                              Go <ExternalLink size={9} />
                            </a>
                          ) : <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => openEditCred(cred)}
                              className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit">
                              <Pencil size={12} className="text-slate-400" />
                            </button>
                            <button onClick={() => deleteCredential(cred.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete">
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── Environment URLs ────────────────────────────────────────── */}
        <Section
          icon={<Globe size={15} className="text-violet-500" />}
          title="Environment URLs"
          count={projectUrls.length}
          onAdd={() => setShowUrlModal(true)}
          addLabel="Add URL"
        >
          {projectUrls.length === 0 ? (
            <EmptyState icon={<Globe size={28} />} message="No URLs added yet." sub="Add dev, staging, and production links." />
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[440px]">
                <thead>
                  <tr className="border-b border-violet-100 dark:border-[#1a3355]">
                    {['Env', 'Label', 'URL', ''].map(h => (
                      <th key={h} className="text-left text-[10px] uppercase font-bold tracking-wide text-slate-400 dark:text-slate-500 py-2 px-3 last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectUrls.map(pu => {
                    const env     = ENV_CONFIG[pu.env] ?? ENV_CONFIG.custom
                    const safeUrl = sanitizeUrl(pu.url)
                    return (
                      <tr key={pu.id} className="border-b border-violet-50 dark:border-[#1a3355]/40 hover:bg-violet-50/50 dark:hover:bg-[#0c2040]/50 transition-colors group">
                        <td className="py-2.5 px-3 w-[80px]">
                          <span className={cn('badge text-[10px] font-bold', env.cls)}>{env.label}</span>
                        </td>
                        <td className="py-2.5 px-3 w-[22%]">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{pu.label}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-xs block">{pu.url}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => copyText(pu.url, `url-${pu.id}`)}
                              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#1a3355] transition-colors opacity-0 group-hover:opacity-100"
                              title="Copy URL">
                              {copied === `url-${pu.id}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                            </button>
                            {safeUrl && (
                              <a href={safeUrl} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#1a3355] transition-colors opacity-0 group-hover:opacity-100"
                                title="Open in new tab">
                                <ExternalLink size={12} className="text-violet-500" />
                              </a>
                            )}
                            <button onClick={() => openEditUrl(pu)}
                              className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit">
                              <Pencil size={12} className="text-slate-400" />
                            </button>
                            <button onClick={() => deleteUrl(pu.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete">
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── Test Sheets & RTM ───────────────────────────────────────── */}
        <Section
          icon={<FileSpreadsheet size={15} className="text-violet-500" />}
          title="Test Sheets & RTM"
          count={sheets.length}
          onAdd={() => setShowSheetModal(true)}
          addLabel="Add Sheet"
        >
          {sheets.length === 0 ? (
            <EmptyState icon={<FileSpreadsheet size={28} />} message="No sheets linked yet." sub="Add Google Sheets for test cases, RTM, regression, and more." />
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[380px]">
                <thead>
                  <tr className="border-b border-violet-100 dark:border-[#1a3355]">
                    {['Type', 'Title', ''].map(h => (
                      <th key={h} className="text-left text-[10px] uppercase font-bold tracking-wide text-slate-400 dark:text-slate-500 py-2 px-3 last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheets.map(sheet => {
                    const type     = SHEET_TYPE_CONFIG[sheet.type] ?? SHEET_TYPE_CONFIG.other
                    const safeUrl  = sanitizeUrl(sheet.url)
                    const embedUrl = getGoogleSheetsEmbedUrl(sheet.url)
                    return (
                      <tr key={sheet.id} className="border-b border-violet-50 dark:border-[#1a3355]/40 hover:bg-violet-50/50 dark:hover:bg-[#0c2040]/50 transition-colors group">
                        <td className="py-2.5 px-3 w-[120px]">
                          <span className={cn('badge text-[10px]', type.cls)}>{type.label}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{sheet.title}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-end gap-1">
                            {(safeUrl || embedUrl) && (
                              <button onClick={() => setViewSheetUrl(sheet.url)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 transition-colors">
                                <Eye size={10} /> Preview
                              </button>
                            )}
                            {safeUrl && (
                              <a href={safeUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-[#1a3355] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e3d66] border border-slate-200 dark:border-[#1a3355] transition-colors"
                                title="Open in new tab">
                                <ExternalLink size={10} /> Open
                              </a>
                            )}
                            <button onClick={() => openEditSheet(sheet)}
                              className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit">
                              <Pencil size={12} className="text-slate-400" />
                            </button>
                            <button onClick={() => deleteSheet(sheet.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete">
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ── Test Cases preview ──────────────────────────────────────── */}
        <Section
          icon={<ClipboardList size={15} className="text-violet-500" />}
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
            <Link href={`/test-cases?project=${id}`} className="text-xs text-violet-500 hover:text-violet-400 font-medium transition-colors">
              View all test cases →
            </Link>
          }
        >
          {testCases.length === 0 ? (
            <EmptyState icon={<ClipboardList size={28} />} message="No test cases yet." />
          ) : (
            <div className="space-y-2">
              {testCases.map(tc => {
                const safeTcUrl  = sanitizeUrl(tc.sheet_url)
                const embedTcUrl = tc.sheet_url ? getGoogleSheetsEmbedUrl(tc.sheet_url) : null
                return (
                  <div key={tc.id} className="flex items-center gap-3 p-3 rounded-xl border border-violet-50 dark:border-[#1a3355] bg-violet-50/30 dark:bg-[#0c2040]/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{tc.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{tc.category ?? 'Uncategorized'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={cn('badge text-[10px]', STATUS_STYLES[tc.status])}>{tc.status}</span>
                      <span className={cn('badge text-[10px]', PRIORITY_STYLES[tc.priority])}>{tc.priority}</span>
                      {(safeTcUrl || embedTcUrl) && (
                        <button onClick={() => setViewSheetUrl(tc.sheet_url!)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 transition-colors">
                          <Eye size={10} /> Preview
                        </button>
                      )}
                      {safeTcUrl && (
                        <a href={safeTcUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-[#1a3355] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e3d66] border border-slate-200 dark:border-[#1a3355] transition-colors">
                          <ExternalLink size={10} /> Open
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* ── Notes ──────────────────────────────────────────────────── */}
        <Section
          icon={<StickyNote size={15} className="text-violet-500" />}
          title="Notes"
          count={notes.length}
          onAdd={() => setShowNoteModal(true)}
          addLabel="Add Note"
        >
          {notes.length === 0 ? (
            <EmptyState icon={<StickyNote size={28} />} message="No notes yet." sub="Add notes, observations or reminders for this project." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {notes.map((note, idx) => {
                const palette    = NOTE_PALETTE[idx % NOTE_PALETTE.length]
                const isExpanded = expandedNotes.has(note.id)
                const isLong     = (note.note?.length ?? 0) > 180
                return (
                  <div key={note.id} className={cn(
                    'group relative rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200',
                    palette.border
                  )}>
                    <div className={cn('h-1.5 bg-gradient-to-r', palette.bar)} />
                    <div className={cn('p-4', palette.bg)}>
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{note.title}</p>
                          <div className={cn('flex items-center gap-1 mt-1 text-xs font-medium', palette.date)}>
                            <CalendarDays size={11} />
                            {formatDate(note.date)}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => openEditNote(note)}
                            className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition-colors" title="Edit">
                            <Pencil size={12} className="text-slate-500" />
                          </button>
                          <button onClick={() => deleteNote(note.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors" title="Delete">
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                      {/* Note text with show more */}
                      {note.note && (
                        <div className="border-t border-black/5 dark:border-white/10 pt-3">
                          <p className={cn(
                            'text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap',
                            !isExpanded && 'line-clamp-4'
                          )}>
                            {note.note}
                          </p>
                          {isLong && (
                            <button
                              onClick={() => setExpandedNotes(prev => {
                                const next = new Set(prev)
                                next.has(note.id) ? next.delete(note.id) : next.add(note.id)
                                return next
                              })}
                              className={cn('mt-2 text-xs font-bold transition-colors hover:opacity-70', palette.date)}
                            >
                              {isExpanded ? '↑ Show less' : '↓ Show more'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* ── Attachments ─────────────────────────────────────────────── */}
        <Section
          icon={<Paperclip size={15} className="text-violet-500" />}
          title="Attachments"
          count={attachments.length}
          actionEl={
            <label className={cn(
              'btn-primary py-1.5 px-3 text-xs flex-shrink-0',
              uploading && 'opacity-60 cursor-not-allowed pointer-events-none'
            )}>
              <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload Files'}
              <input
                type="file"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={e => { if (e.target.files?.length) uploadAttachments(e.target.files) }}
              />
            </label>
          }
        >
          {attachments.length === 0 ? (
            <EmptyState icon={<Paperclip size={28} />} message="No files uploaded yet." sub="Upload images, videos, PDFs, docs, or any other files." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {attachments.map(att => (
                <AttachmentCard
                  key={att.id}
                  attachment={att}
                  onDownload={downloadAttachment}
                  onDelete={deleteAttachment}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ── Reports preview ─────────────────────────────────────────── */}
        <Section
          icon={<FileBarChart2 size={15} className="text-violet-500" />}
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
            <Link href={`/reports?project=${id}`} className="text-xs text-violet-500 hover:text-violet-400 font-medium transition-colors">
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
                      { label: 'Blocked', val: r.blocked, cls: 'text-violet-500 dark:text-violet-400' },
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
          <div className="bg-white dark:bg-[#122240] border border-violet-100 dark:border-[#1a3355] rounded-2xl shadow-2xl w-full max-w-5xl h-[82vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100 dark:border-[#1a3355] flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={15} className="text-violet-500" />
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
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-violet-50 dark:hover:bg-[#1a3355] transition-colors"
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
        <Modal title={editingCredId ? 'Edit Credential' : 'Add Credential'} sub="Stored with AES-256 + TLS encryption" onClose={closeCredModal}>
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
              <div className="flex gap-2">
                <input value={credForm.url} onChange={e => setCredForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://app.example.com/login" className="input-field flex-1" />
                {sanitizeUrl(credForm.url) && (
                  <a
                    href={sanitizeUrl(credForm.url)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-xs font-semibold transition-colors flex-shrink-0 dark:bg-violet-500/10 dark:border-violet-500/30 dark:text-violet-300 dark:hover:bg-violet-500/20"
                  >
                    <ExternalLink size={13} /> Open
                  </a>
                )}
              </div>
            </Field>
            <Field label="Notes (optional)">
              <textarea value={credForm.notes} onChange={e => setCredForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..." rows={2} className="input-field resize-none" />
            </Field>
          </div>
          <ModalFooter onCancel={closeCredModal} onSave={saveCred} saving={saving} saveLabel={editingCredId ? 'Save Changes' : 'Save Credential'} />
        </Modal>
      )}

      {/* ── Add URL modal ──────────────────────────────────────────────── */}
      {showUrlModal && (
        <Modal title={editingUrlId ? 'Edit URL' : 'Add Environment URL'} onClose={closeUrlModal}>
          <div className="space-y-3">
            <Field label="Environment">
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(ENV_CONFIG) as Array<keyof typeof ENV_CONFIG>).map(env => (
                  <button key={env}
                    onClick={() => setUrlForm(f => ({ ...f, env }))}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                      urlForm.env === env
                        ? cn(ENV_CONFIG[env].cls, 'scale-105')
                        : 'border-slate-200 dark:border-[#1a3355] text-slate-500 dark:text-slate-400 hover:border-violet-200 dark:hover:border-violet-500/40'
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
          <ModalFooter onCancel={closeUrlModal} onSave={saveUrl} saving={saving} saveLabel={editingUrlId ? 'Save Changes' : 'Save URL'} />
        </Modal>
      )}

      {/* ── Add Sheet modal ────────────────────────────────────────────── */}
      {showSheetModal && (
        <Modal title={editingSheetId ? 'Edit Sheet' : 'Add Sheet / Document Link'} onClose={closeSheetModal}>
          <div className="space-y-3">
            <Field label="Type">
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(SHEET_TYPE_CONFIG) as Array<keyof typeof SHEET_TYPE_CONFIG>).map(t => (
                  <button key={t}
                    onClick={() => setSheetForm(f => ({ ...f, type: t }))}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                      sheetForm.type === t
                        ? cn(SHEET_TYPE_CONFIG[t].cls, 'scale-105')
                        : 'border-slate-200 dark:border-[#1a3355] text-slate-500 dark:text-slate-400 hover:border-violet-200 dark:hover:border-violet-500/40'
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
          <ModalFooter onCancel={closeSheetModal} onSave={saveSheet} saving={saving} saveLabel={editingSheetId ? 'Save Changes' : 'Save Sheet'} />
        </Modal>
      )}

      {/* ── Add Note modal ─────────────────────────────────────────────── */}
      {showNoteModal && (
        <Modal title={editingNoteId ? 'Edit Note' : 'Add Note'} onClose={closeNoteModal}>
          <div className="space-y-3">
            <Field label="Title *">
              <input value={noteForm.title} onChange={e => setNoteForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Sprint 3 observations" className="input-field" autoFocus />
            </Field>
            <Field label="Date *">
              <input type="date" value={noteForm.date} onChange={e => setNoteForm(f => ({ ...f, date: e.target.value }))}
                className="input-field" />
            </Field>
            <Field label="Note">
              <textarea value={noteForm.note} onChange={e => setNoteForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Write your note here..." rows={4} className="input-field resize-none" />
            </Field>
          </div>
          <ModalFooter onCancel={closeNoteModal} onSave={saveNote} saving={saving} saveLabel={editingNoteId ? 'Save Changes' : 'Save Note'} />
        </Modal>
      )}
    </div>
  )
}

// ── Note palette ──────────────────────────────────────────────────────────
const NOTE_PALETTE = [
  { bar: 'from-violet-500 to-purple-600',  bg: 'bg-violet-50/70 dark:bg-violet-900/10',  border: 'border-violet-200 dark:border-violet-800/40',  date: 'text-violet-600 dark:text-violet-400' },
  { bar: 'from-sky-500 to-blue-600',       bg: 'bg-sky-50/70 dark:bg-sky-900/10',        border: 'border-sky-200 dark:border-sky-800/40',        date: 'text-sky-600 dark:text-sky-400' },
  { bar: 'from-emerald-500 to-teal-600',   bg: 'bg-emerald-50/70 dark:bg-emerald-900/10',border: 'border-emerald-200 dark:border-emerald-800/40', date: 'text-emerald-600 dark:text-emerald-400' },
  { bar: 'from-fuchsia-500 to-pink-600',   bg: 'bg-fuchsia-50/70 dark:bg-fuchsia-900/10',border: 'border-fuchsia-200 dark:border-fuchsia-800/40', date: 'text-fuchsia-600 dark:text-fuchsia-400' },
  { bar: 'from-indigo-500 to-violet-600',  bg: 'bg-indigo-50/70 dark:bg-indigo-900/10',  border: 'border-indigo-200 dark:border-indigo-800/40',  date: 'text-indigo-600 dark:text-indigo-400' },
]

// ── Attachment helpers ─────────────────────────────────────────────────────
function getFileVisual(mimeType: string | null): { icon: React.ReactNode; label: string; color: string } {
  if (mimeType?.startsWith('image/')) return { icon: <ImageIcon size={28} />, label: 'IMAGE', color: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10' }
  if (mimeType?.startsWith('video/')) return { icon: <Video size={28} />, label: 'VIDEO', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' }
  if (mimeType === 'application/pdf') return { icon: <FileText size={28} />, label: 'PDF', color: 'text-red-500 bg-red-50 dark:bg-red-500/10' }
  if (mimeType?.includes('word') || mimeType?.includes('document')) return { icon: <FileText size={28} />, label: 'DOC', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' }
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return { icon: <FileText size={28} />, label: 'XLS', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' }
  return { icon: <FileIcon size={28} />, label: 'FILE', color: 'text-slate-500 bg-slate-100 dark:bg-slate-500/10' }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function AttachmentCard({
  attachment, onDownload, onDelete,
}: {
  attachment: ProjectAttachment
  onDownload: (a: ProjectAttachment) => void
  onDelete: (a: ProjectAttachment) => void
}) {
  const isImage = attachment.mime_type?.startsWith('image/')
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const visual = getFileVisual(attachment.mime_type)

  useEffect(() => {
    if (!isImage) return
    fetch('/api/attachments/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath: attachment.storage_path }),
    })
      .then(r => r.json())
      .then(d => { if (d.signedUrl) setImgUrl(d.signedUrl) })
  }, [attachment.storage_path, isImage])

  return (
    <div className="group card flex flex-col overflow-hidden hover:shadow-md hover:border-violet-200 transition-all duration-200">
      {/* Preview area */}
      <div className="w-full h-28 bg-slate-50 dark:bg-[#0c2040]/60 flex items-center justify-center overflow-hidden flex-shrink-0">
        {isImage && imgUrl ? (
          <img src={imgUrl} alt={attachment.name} className="w-full h-full object-cover" />
        ) : (
          <div className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl', visual.color)}>
            {visual.icon}
            <span className="text-[9px] font-black tracking-widest">{visual.label}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight" title={attachment.name}>
            {attachment.name}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{formatFileSize(attachment.size)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-auto">
          <button
            onClick={() => onDownload(attachment)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 text-[11px] font-semibold transition-colors"
          >
            <Download size={11} /> Download
          </button>
          <button
            onClick={() => onDelete(attachment)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-colors flex-shrink-0"
            title="Delete file"
          >
            <Trash2 size={13} className="text-red-400" />
          </button>
        </div>
      </div>
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
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
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
        <div className="pt-1 border-t border-violet-50 dark:border-[#1a3355]">
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
      <div className="bg-white dark:bg-[#122240] border border-violet-100 dark:border-[#1a3355] rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-violet-50 dark:border-[#1a3355]">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-violet-50 dark:hover:bg-[#1a3355] transition-colors"
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
