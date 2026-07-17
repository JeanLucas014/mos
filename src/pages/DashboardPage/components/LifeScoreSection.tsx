import { useState } from 'react'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import {
  useDashFinancas,
  useDashHabits,
  useDashGoals,
  useDashSports,
  useDashTasksScore,
  useDashEstudos,
} from '../../../hooks/useDashboard'
import {
  calcFinancasScore, calcSaudeScore, calcTarefasScore,
  calcHabitosScore, calcEstudosScore, calcMetasScore, scoreColor,
} from '../scoreUtils'
import { ScoreGauge } from './ScoreGauge'

/* ── Life Score Section ─────────────────────────────────────────── */
export function LifeScoreSection() {
  const [open, setOpen] = useState(false)

  const financas   = useDashFinancas()
  const tasksScore = useDashTasksScore()
  const { total: habitTotal, doneToday } = useDashHabits()
  const sportsData = useDashSports()
  const estudos    = useDashEstudos()
  const { data: goals = [] } = useDashGoals()

  const scores = {
    financas: calcFinancasScore(financas.data?.receitas ?? 0, financas.data?.despesas ?? 0),
    saude:    calcSaudeScore(sportsData.countWeek ?? 0, sportsData.weekGoal ?? 5, sportsData.lastWorkoutDate ?? null),
    tarefas:  calcTarefasScore(tasksScore.data?.total ?? 0, tasksScore.data?.overdue ?? 0),
    habitos:  calcHabitosScore(doneToday, habitTotal),
    estudos:  calcEstudosScore(estudos.activeStudies, estudos.readingBooks, estudos.avgProgress ?? 0),
    metas:    calcMetasScore(goals ?? []),
  }

  const overall = Math.round(
    (scores.financas * 25 + scores.saude * 25 + scores.tarefas * 20 +
     scores.habitos * 15 + scores.estudos * 10 + scores.metas * 5) / 100,
  )

  const radarData = [
    { subject: 'Financas', score: scores.financas },
    { subject: 'Saude',    score: scores.saude    },
    { subject: 'Tarefas',  score: scores.tarefas  },
    { subject: 'Habitos',  score: scores.habitos  },
    { subject: 'Estudos',  score: scores.estudos  },
    { subject: 'Metas',    score: scores.metas    },
  ]

  const AREAS = [
    { label: 'Financas', score: scores.financas, meta: financas.data?.saldo != null ? `R$ ${Math.abs(Math.round(financas.data.saldo)).toLocaleString('pt-BR')} ${financas.data.saldo >= 0 ? 'positivo' : 'negativo'}` : '—' },
    { label: 'Saude',    score: scores.saude,    meta: `${sportsData.countWeek ?? 0}/${sportsData.weekGoal ?? 5} treinos` },
    { label: 'Tarefas',  score: scores.tarefas,  meta: (tasksScore.data?.overdue ?? 0) > 0 ? `${tasksScore.data?.overdue} atrasadas` : `${tasksScore.data?.total ?? 0} pendentes` },
    { label: 'Habitos',  score: scores.habitos,  meta: `${doneToday}/${habitTotal} hoje` },
    { label: 'Estudos',  score: scores.estudos,  meta: estudos.activeStudies > 0 ? `${estudos.activeStudies} ativo(s)` : 'Sem atividade' },
    { label: 'Metas',    score: scores.metas,    meta: `${goals.length} ativas` },
  ]

  return (
    <div className="mb-6">
      <div
        className="rounded-2xl border border-line overflow-hidden"
        style={{ background: 'var(--bg2)' }}
      >
        {/* LINHA SUPERIOR: Gauge | Mini scores */}
        <div className="flex flex-col sm:flex-row" style={{ borderBottom: '1px solid var(--border)' }}>

          {/* Gauge */}
          <div
            className="flex flex-col items-center justify-center flex-shrink-0 border-b sm:border-b-0 sm:border-r border-line"
            style={{ padding: '16px 20px', gap: 4 }}
          >
            <div className="sm:hidden"><ScoreGauge score={overall} size={100} /></div>
            <div className="hidden sm:block"><ScoreGauge score={overall} size={180} /></div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center' as const }}>
              Score de Vida
            </div>
          </div>

          {/* Mini scores + chevron */}
          <div
            className="flex-1 flex items-center gap-3 cursor-pointer"
            style={{ padding: '14px 16px' }}
            onClick={() => setOpen(p => !p)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
                Visao geral
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px 14px' }}>
                {AREAS.map(a => (
                  <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: scoreColor(a.score), flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{a.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: scoreColor(a.score) }}>{a.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
              style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M4 6l4 4 4-4" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* LINHA INFERIOR: Radar | Grid de áreas — só quando aberto */}
        {open && (
          <div className="flex flex-col sm:flex-row">

            {/* Radar — oculto em mobile */}
            <div
              className="hidden sm:flex items-center justify-center flex-shrink-0"
              style={{ borderRight: '1px solid var(--border)', padding: '8px 0', width: 228 }}
            >
              <ResponsiveContainer width={228} height={200}>
                <RadarChart data={radarData} margin={{ top: 14, right: 38, bottom: 14, left: 38 }}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: 'var(--text2)', fontSize: 10, fontFamily: 'Manrope', fontWeight: 400 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                    dot={{ fill: '#0ea5e9', r: 2.5 } as any}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Grid 2x3 das áreas — 2 colunas em mobile, 3 em desktop */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3">
              {AREAS.map((a) => {
                const sc = scoreColor(a.score)
                return (
                  <div
                    key={a.label}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid var(--border)',
                      borderRight: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>
                      {a.label}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: sc, fontFamily: 'Sora, sans-serif', lineHeight: 1, marginBottom: 5 }}>
                      {a.score}
                    </div>
                    <div style={{ height: 2, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: `${a.score}%`, height: '100%', background: sc, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--text3)' }}>{a.meta}</div>
                  </div>
                )
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
