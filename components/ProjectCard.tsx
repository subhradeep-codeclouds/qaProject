'use client'

import Link from 'next/link'
import { ExternalLink, FileBarChart2, ClipboardList, MoreVertical } from 'lucide-react'
import { cn, getProjectGradient, PROJECT_STATUS_STYLES } from '@/lib/utils'
import type { Project } from '@/lib/supabase'

interface ProjectCardProps {
  project: Project
  testCaseCount?: number
  reportCount?: number
}

export default function ProjectCard({ project, testCaseCount = 0, reportCount = 0 }: ProjectCardProps) {
  const gradient = getProjectGradient(project.color)

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="glass-card-hover p-5 cursor-pointer group relative overflow-hidden">
        {/* Color accent top bar */}
        <div className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-80', gradient)} />

        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg text-white font-bold text-lg', gradient)}>
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('badge text-[10px]', PROJECT_STATUS_STYLES[project.status])}>
              {project.status}
            </span>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-lg">
              <MoreVertical size={14} className="text-slate-400" />
            </button>
          </div>
        </div>

        <h3 className="font-semibold text-white text-sm mb-1 truncate">{project.name}</h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 min-h-[2rem]">
          {project.description ?? 'No description added.'}
        </p>

        <div className="flex items-center gap-4 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ClipboardList size={12} />
            <span>{testCaseCount} test cases</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <FileBarChart2 size={12} />
            <span>{reportCount} reports</span>
          </div>
          <ExternalLink size={11} className="ml-auto text-slate-600 group-hover:text-violet-400 transition-colors" />
        </div>
      </div>
    </Link>
  )
}
