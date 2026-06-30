'use client'

import {
  calculateImsaScore,
  buildScoreInputs,
  IMSA_MAX_SCORE,
  COMPLEXITY_CUTOFF,
  SEVERITY_COLORS,
  IMSA_GRID,
} from '../utils'

type Question = {
  variableName: string
  type: string
  answerDistribution: Record<string, number>
}

export default function ImsaResultSummary({ questions }: { questions: Question[] }) {
  const { answersByVarName, rawAnswersByVarName } = buildScoreInputs(questions)
  const { totalScore, domainScores } = calculateImsaScore(answersByVarName, rawAnswersByVarName)
  const isComplex = totalScore >= COMPLEXITY_CUTOFF
  const fillPct = Math.round((totalScore / IMSA_MAX_SCORE) * 100)
  const cutoffPct = Math.round((COMPLEXITY_CUTOFF / IMSA_MAX_SCORE) * 100)

  return (
    <div style={styles.wrapper}>
      {/* ── Progress bar ──────────────────────────────────────── */}
      <div style={styles.section}>
        <div style={styles.barHeader}>
          <span style={styles.barLabel}>Skor IMSA</span>
          <div style={styles.barMeta}>
            <span style={styles.barScore}>{totalScore} <span style={styles.barMax}>/ {IMSA_MAX_SCORE}</span></span>
            <span style={{ ...styles.badge, ...(isComplex ? styles.badgeRed : styles.badgeGreen) }}>
              {isComplex ? 'KOMPLEKS' : 'Tidak kompleks'}
            </span>
          </div>
        </div>
        <div style={styles.barTrack}>
          <div style={{ ...styles.barFill, width: `${fillPct}%`, backgroundColor: isComplex ? '#dc2626' : '#16a34a' }} />
          {/* Cutoff marker */}
          <div style={{ ...styles.cutoffLine, left: `${cutoffPct}%` }}>
            <div style={styles.cutoffTick} />
            <span style={styles.cutoffLabel}>{COMPLEXITY_CUTOFF}</span>
          </div>
        </div>
        <div style={styles.barCaption}>
          Garis batas kompleksitas IM-SA = {COMPLEXITY_CUTOFF} (skor ≥ {COMPLEXITY_CUTOFF} = kompleks)
        </div>
      </div>

      {/* ── INTERMED Grid ─────────────────────────────────────── */}
      <div style={styles.section}>
        <div style={styles.gridTitle}>INTERMED Grid</div>
        <div style={styles.gridScrollWrapper}>
          <table style={styles.gridTable}>
            <thead>
              <tr>
                <th style={{ ...styles.gridTh, ...styles.gridThDomain }}></th>
                {['Historis', 'Saat ini', 'Prognosis'].map(seg => (
                  <th key={seg} style={styles.gridTh}>{seg}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IMSA_GRID.map(row => (
                <tr key={row.domain}>
                  <td style={styles.gridDomainCell}>{row.domain}</td>
                  {(['Historis', 'Saat ini', 'Prognosis'] as const).map(seg => {
                    const anchors = row.segments[seg]
                    return (
                      <td key={seg} style={styles.gridCell}>
                        {anchors.map(([key, label]) => {
                          const score = domainScores[key] ?? 0
                          const color = SEVERITY_COLORS[score] ?? SEVERITY_COLORS[0]
                          return (
                            <div key={key} style={{ ...styles.chip, backgroundColor: color.bg, color: color.fg }}>
                              <span style={styles.chipScore}>{score}</span>
                              <span style={styles.chipLabel}>{label}</span>
                            </div>
                          )
                        })}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────── */}
      <div style={styles.legend}>
        {([0, 1, 2, 3] as const).map(score => {
          const c = SEVERITY_COLORS[score]
          return (
            <span key={score} style={{ ...styles.legendItem, backgroundColor: c.bg, color: c.fg }}>
              <strong>{score}</strong> — {c.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    marginTop: '2rem',
    marginBottom: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  section: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
  },
  // Bar
  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  barLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
  },
  barMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  barScore: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
  },
  barMax: {
    fontSize: '14px',
    fontWeight: 400,
    color: '#94a3b8',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  barTrack: {
    position: 'relative',
    height: '14px',
    backgroundColor: '#f1f5f9',
    borderRadius: '999px',
    overflow: 'visible',
  },
  barFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.4s ease',
    minWidth: '4px',
  },
  cutoffLine: {
    position: 'absolute',
    top: '-4px',
    bottom: '-4px',
    width: '2px',
    backgroundColor: '#94a3b8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  cutoffTick: {
    width: '2px',
    height: '100%',
    backgroundColor: '#64748b',
  },
  cutoffLabel: {
    position: 'absolute',
    top: '20px',
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transform: 'translateX(-50%)',
  },
  barCaption: {
    marginTop: '1.5rem',
    fontSize: '11px',
    color: '#94a3b8',
  },
  // Grid
  gridTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '0.75rem',
  },
  gridScrollWrapper: {
    overflowX: 'auto',
  },
  gridTable: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '480px',
  },
  gridTh: {
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
    textAlign: 'center',
  },
  gridThDomain: {
    textAlign: 'left',
    width: '140px',
  },
  gridDomainCell: {
    padding: '10px 12px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
    verticalAlign: 'top',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
  },
  gridCell: {
    padding: '8px 10px',
    verticalAlign: 'top',
    borderBottom: '1px solid #f1f5f9',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '4px',
    marginRight: '4px',
    whiteSpace: 'nowrap',
  },
  chipScore: {
    fontSize: '13px',
    fontWeight: 800,
  },
  chipLabel: {
    fontWeight: 500,
  },
  // Legend
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    paddingLeft: '0.25rem',
  },
  legendItem: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 500,
  },
}
