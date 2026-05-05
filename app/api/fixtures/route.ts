import { NextResponse } from 'next/server'

export async function GET() {
  // Test fixtures for development
  const testFixtures = [
    {
      id: 1,
      utcDate: '2026-06-15T16:00:00Z',
      status: 'FINISHED',
      matchday: 1,
      stage: 'GROUP_STAGE',
      group: 'A',
      homeTeam: { id: 1, name: 'Brazil', shortName: 'BRA', tla: 'BRA' },
      awayTeam: { id: 2, name: 'Argentina', shortName: 'ARG', tla: 'ARG' },
      score: {
        winner: 'HOME_TEAM',
        duration: 'REGULAR',
        fullTime: { home: 2, away: 1 },
        halfTime: { home: 1, away: 0 }
      }
    },
    {
      id: 2,
      utcDate: '2026-06-16T20:00:00Z',
      status: 'FINISHED',
      matchday: 1,
      stage: 'GROUP_STAGE',
      group: 'A',
      homeTeam: { id: 3, name: 'France', shortName: 'FRA', tla: 'FRA' },
      awayTeam: { id: 4, name: 'Germany', shortName: 'GER', tla: 'GER' },
      score: {
        winner: 'AWAY_TEAM',
        duration: 'REGULAR',
        fullTime: { home: 1, away: 3 },
        halfTime: { home: 0, away: 2 }
      }
    },
    {
      id: 3,
      utcDate: '2026-06-17T14:00:00Z',
      status: 'IN_PLAY',
      matchday: 1,
      stage: 'GROUP_STAGE',
      group: 'B',
      homeTeam: { id: 5, name: 'Spain', shortName: 'ESP', tla: 'ESP' },
      awayTeam: { id: 6, name: 'England', shortName: 'ENG', tla: 'ENG' },
      score: {
        winner: null,
        duration: 'REGULAR',
        fullTime: { home: 1, away: 0 },
        halfTime: { home: 1, away: 0 }
      }
    },
    {
      id: 4,
      utcDate: '2026-06-18T17:00:00Z',
      status: 'SCHEDULED',
      matchday: 2,
      stage: 'GROUP_STAGE',
      group: 'A',
      homeTeam: { id: 1, name: 'Brazil', shortName: 'BRA', tla: 'BRA' },
      awayTeam: { id: 3, name: 'France', shortName: 'FRA', tla: 'FRA' },
      score: {
        winner: null,
        duration: 'REGULAR',
        fullTime: { home: null, away: null },
        halfTime: { home: null, away: null }
      }
    },
    {
      id: 5,
      utcDate: '2026-06-19T21:00:00Z',
      status: 'SCHEDULED',
      matchday: 2,
      stage: 'GROUP_STAGE',
      group: 'B',
      homeTeam: { id: 7, name: 'Italy', shortName: 'ITA', tla: 'ITA' },
      awayTeam: { id: 8, name: 'Netherlands', shortName: 'NED', tla: 'NED' },
      score: {
        winner: null,
        duration: 'REGULAR',
        fullTime: { home: null, away: null },
        halfTime: { home: null, away: null }
      }
    }
  ]

  return NextResponse.json(testFixtures)

  // Uncomment below to use real API when WC starts
  /*
  const res = await fetch(
    'http://api.football-data.org/v4/competitions/WC/matches?stage=GROUP_STAGE',
    {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_API_KEY!
      },
      next: { revalidate: 60 }
    }
  )
  const data = await res.json()
  return NextResponse.json(data.matches || [])
  */
}