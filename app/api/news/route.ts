import { NextResponse } from 'next/server'

export type NewsArticle = {
  id: number
  title: string
  url: string
  cover_image: string | null
  tag_list: string[]
  readable_publish_date: string
  reading_time_minutes: number
  user: { name: string }
  description: string
  source: string
}

const TAGS = ['testing', 'qa', 'testautomation', 'automation', 'playwright', 'cypress']

export async function GET() {
  try {
    const results = await Promise.allSettled(
      TAGS.slice(0, 3).map(tag =>
        fetch(`https://dev.to/api/articles?tag=${tag}&per_page=8&state=fresh`, {
          next: { revalidate: 3600 },
        }).then(r => r.json())
      )
    )

    const all: NewsArticle[] = []
    results.forEach(r => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        r.value.forEach((a: any) => {
          all.push({
            id: a.id,
            title: a.title,
            url: a.url,
            cover_image: a.cover_image,
            tag_list: a.tag_list?.slice(0, 3) ?? [],
            readable_publish_date: a.readable_publish_date,
            reading_time_minutes: a.reading_time_minutes ?? 3,
            user: { name: a.user?.name ?? 'Dev.to' },
            description: a.description ?? '',
            source: 'Dev.to',
          })
        })
      }
    })

    const unique = all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
    const shuffled = unique.sort(() => Math.random() - 0.5).slice(0, 12)

    return NextResponse.json({ articles: shuffled })
  } catch {
    return NextResponse.json({ articles: [] })
  }
}
