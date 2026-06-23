import { NextResponse } from 'next/server'

const LAT = 22.5726
const LON = 88.3639

export async function GET() {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index` +
      `&hourly=temperature_2m,apparent_temperature,weather_code,precipitation_probability,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,wind_speed_10m_max` +
      `&timezone=Asia%2FKolkata&forecast_days=16&past_days=3`

    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error('upstream error')
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 })
  }
}
