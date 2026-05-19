'use client'

import Link from 'next/link'
import { ExternalLink, FileBarChart2, ClipboardList } from 'lucide-react'
import { cn, getProjectGradient, PROJECT_STATUS_STYLES } from '@/lib/utils'
import type { Project } from '@/lib/supabase'

interface ProjectCardProps {
  project: Project
  testCaseCount?: number
  reportCount?: number
}

const STATUS_CHIP: Record<string, string> = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  paused:    'bg-amber-50 text-amber-700 border-amber-200',
  archived:  'bg-slate-50 text-slate-500 border-slate-200',
}

export default function ProjectCard({ project, testCaseCount = 0, reportCount = 0 }: ProjectCardProps) {
  const gradient = getProjectGradient(project.color)

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="card-hover p-5 cursor-pointer group relative overflow-hidden">
        <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r rounded-t-2xl', gradient)} />

        <div className="flex items-start justify-between mb-4 pt-1">
          <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md text-white font-bold text-lg', gradient)}>
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('badge text-[10px]', STATUS_CHIP[project.status] ?? STATUS_CHIP.active)}>
              {project.status}
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-slate-800 text-sm mb-1 truncate">{project.name}</h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 min-h-[2rem]">
          {project.description ?? 'No description added.'}
        </p>

        <div className="flex items-center gap-4 pt-3 border-t border-violet-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ClipboardList size={12} className="text-violet-400" />
            <span>{testCaseCount} test cases</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <FileBarChart2 size={12} className="text-indigo-400" />
            <span>{reportCount} reports</span>
          </div>
          <ExternalLink size={11} className="ml-auto text-slate-300 group-hover:text-violet-500 transition-colors" />
        </div>
      </div>
    </Link>
  )
}
