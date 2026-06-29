'use client'

import { useEffect, useState } from 'react'
import { NESTED_SUBS, NESTED_SUB_VARS, Q15_VARNAME, scoreOrganisasiLayanan } from '../utils'

type AnalyticsQuestion = {
  id: string
  variableName: string
  prompt: string
  type: string
  options: Array<{ label: string; value: string | number; requiresText?: boolean }> | null
  answerDistribution: Record<string, number>
}

const SCORED_PREFIXES = ['hist_', 'saat_ini_', 'prog_']

/**
 * Questions that carry no IMSA scoring weight: identity/demographic questions
 * (before PRA-1), PRA questions (pra_), and supplementary questions (tamb_).
 * calculateImsaScore only uses hist_/saat_ini_/prog_ variables; pra_/tamb_
 * contribute 0. Detected by the absence of any scored prefix.
 */
function isNonScoredQuestion(variableName: string): boolean {
  return !SCORED_PREFIXES.some((p) => variableName.startsWith(p))
}

/**
 * Resolve stored key(s) back to human-readable labels.
 * When an option has requiresText=true (Lainnya) and the user typed companion text,
 * show that text directly instead of the option label "Lainnya".
 *
 * @param companionText - free-text from the paired _lainnya companion question, if any.
 */
function getAnswerInfo(
  question: AnalyticsQuestion,
  companionText: string | null
): { labels: string[]; rawKeys: string[] } {
  const keys = Object.keys(question.answerDistribution)
  if (keys.length === 0) return { labels: ['—'], rawKeys: ['—'] }

  if (!question.options) {
    // number / text — raw value IS the answer
    return { labels: keys, rawKeys: keys }
  }

  const labels = keys.map((key) => {
    // Look up by stored value first (Q15: letter codes 'a','b',…),
    // then by label string (fallback for older answers stored by label).
    const opt = question.options!.find(
      (o) => String(o.value) === key || o.label === key
    )
    if (!opt) return key
    // Lainnya option: show companion text if user filled it in
    if (opt.requiresText && companionText) return companionText
    return opt.label
  })

  return { labels, rawKeys: keys }
}

export default function AnalyticsDashboard({ inisial }: { inisial: string }) {
  const [questions, setQuestions] = useState<AnalyticsQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetch(`/api/analytics?inisial=${encodeURIComponent(inisial)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError('Gagal memuat data analitik')
        setLoading(false)
      })
    return () => controller.abort()
  }, [inisial])

  if (loading) {
    return <div style={styles.loading}>Memuat analitik…</div>
  }

  if (error) {
    return <div style={styles.errorBox}>{error}</div>
  }

  // Build companion lookup: parentVariableName → free-text typed by user.
  // Companion variableName = parentVariableName + '_lainnya' (8 chars) — same convention as Wizard.
  const companionTextMap = new Map<string, string>()
  for (const q of questions) {
    if (q.variableName.endsWith('_lainnya')) {
      const parentVarName = q.variableName.slice(0, -8)
      // Single-user view: answerDistribution has exactly 1 key = the typed text
      const text = Object.keys(q.answerDistribution)[0] ?? ''
      if (text) companionTextMap.set(parentVarName, text)
    }
  }

  // Build sub-question lookup: parentVariableName → sub question object.
  const subByParent = new Map<string, AnalyticsQuestion>()
  for (const [parentVar, cfg] of Object.entries(NESTED_SUBS)) {
    const sub = questions.find(q => q.variableName === cfg.subVar)
    if (sub) subByParent.set(parentVar, sub)
  }

  // Show only answered non-companion, non-nested-sub questions.
  // Companion _lainnya and nested sub rows are folded into their parent's row.
  const questionsWithAnswers = questions.filter(
    (q) =>
      !q.variableName.endsWith('_lainnya') &&
      !NESTED_SUB_VARS.includes(q.variableName) &&
      Object.keys(q.answerDistribution).length > 0
  )

  if (questionsWithAnswers.length === 0) {
    return (
      <div style={styles.emptyState}>
        Belum ada data respons. Analitik akan muncul setelah responden mengisi kuesioner.
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: '48px' }}>No</th>
            <th style={styles.th}>Pertanyaan</th>
            <th style={styles.th}>Jawaban</th>
            <th style={{ ...styles.th, width: '90px' }}>Nilai</th>
          </tr>
        </thead>
        <tbody>
          {questionsWithAnswers.map((q, idx) => {
            const companionText = companionTextMap.get(q.variableName) ?? null
            const { labels, rawKeys } = getAnswerInfo(q, companionText)
            // If this is a parent with a nested sub, fold sub answer below parent answer
            const subQ = subByParent.get(q.variableName)
            const subHasAnswer = subQ && Object.keys(subQ.answerDistribution).length > 0
            const subCompText = subQ ? (companionTextMap.get(subQ.variableName) ?? null) : null
            const subInfo = subHasAnswer ? getAnswerInfo(subQ!, subCompText) : null
            return (
              <tr key={q.id} style={styles.tr}>
                <td style={{ ...styles.td, ...styles.tdNo }}>{idx + 1}</td>
                <td style={styles.td}>
                  <span style={styles.prompt}>{q.prompt}</span>
                </td>
                <td style={styles.td}>
                  {labels.map((lbl, i) => (
                    <span key={i} style={styles.labelLine}>{lbl}</span>
                  ))}
                  {subInfo && (
                    <span style={styles.subAnswerBlock}>
                      <span style={styles.subAnswerLabel}>{subQ!.prompt}</span>
                      {subInfo.labels.map((lbl, i) => (
                        <span key={i} style={styles.labelLine}>{lbl}</span>
                      ))}
                    </span>
                  )}
                </td>
                <td style={{ ...styles.td, ...styles.tdValue }}>
                  {q.variableName === Q15_VARNAME
                    ? <code style={styles.rawCode}>{scoreOrganisasiLayanan(Object.keys(q.answerDistribution))}</code>
                    : isNonScoredQuestion(q.variableName)
                      ? <span style={{ color: '#cbd5e1' }}>—</span>
                      : <code style={styles.rawCode}>{rawKeys.join(', ')}</code>
                  }
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    marginTop: '2rem',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  } as React.CSSProperties,
  th: {
    padding: '1.25rem 1.5rem',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
  } as React.CSSProperties,
  tr: {
    borderBottom: '1px solid #f1f5f9',
  } as React.CSSProperties,
  td: {
    padding: '1rem 1.5rem',
    fontSize: '14px',
    color: '#334155',
    fontWeight: 500,
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
  tdNo: {
    color: '#94a3b8',
    fontWeight: 400,
    fontSize: '13px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  tdValue: {
    textAlign: 'center' as const,
  } as React.CSSProperties,
  prompt: {
    display: 'block',
    fontSize: '14px',
    color: '#0f172a',
    lineHeight: 1.5,
    fontWeight: 500,
  } as React.CSSProperties,
  labelLine: {
    display: 'block',
    lineHeight: 1.5,
    paddingBottom: '2px',
  } as React.CSSProperties,
  subAnswerBlock: {
    display: 'block',
    marginTop: '6px',
    paddingTop: '6px',
    borderTop: '1px dashed #e2e8f0',
  } as React.CSSProperties,
  subAnswerLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 600,
    marginBottom: '2px',
  } as React.CSSProperties,
  rawCode: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'monospace',
    fontWeight: 700,
  } as React.CSSProperties,
  loading: {
    padding: '4rem',
    textAlign: 'center' as const,
    color: '#64748b',
    fontSize: '18px',
    fontWeight: 500,
  } as React.CSSProperties,
  errorBox: {
    padding: '1.5rem',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderRadius: '16px',
    border: '1px solid #fecaca',
    marginTop: '2rem',
  } as React.CSSProperties,
  emptyState: {
    padding: '5rem 2rem',
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontSize: '1.1rem',
    fontWeight: 500,
    border: '2px dashed #e2e8f0',
    borderRadius: '24px',
    marginTop: '3rem',
    backgroundColor: '#f8fafc',
  } as React.CSSProperties,
}
