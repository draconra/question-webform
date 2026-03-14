import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { QuestionnaireService, PrismaQuestionnaireRepository } from "@/features/questionnaire"
import AnalyticsDashboard from "@/features/questionnaire/components/AnalyticsDashboard"
import ScoreTable from "@/features/questionnaire/components/ScoreTable"
import { Users, FileText, Download, LayoutDashboard, LogOut, CheckSquare } from "lucide-react"

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const selectedInisial = typeof params.inisial === 'string' ? params.inisial : null

  const session = await auth()
  
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/admin")
  }

  const repository = new PrismaQuestionnaireRepository(prisma)
  const service = new QuestionnaireService(repository)
  const responsesCount = await service.countResponses()
  const template = await service.getTemplate()

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBox}>
            <LayoutDashboard size={24} color="white" />
          </div>
          <h1 style={styles.pageTitle}>Admin Dashboard</h1>
        </div>
        
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <button type="submit" style={styles.signOutBtn}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </form>
      </header>

      {/* Stats row */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <h2 style={styles.statTitle}>Total Respons</h2>
            <div style={styles.iconCircleBlue}>
              <Users size={20} color="#3b82f6" />
            </div>
          </div>
          <div style={styles.statValue}>{responsesCount}</div>
          <p style={styles.statSubtitle}>Seluruh respons yang masuk</p>
        </div>

        {template && (
          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <h2 style={styles.statTitle}>Kuesioner Aktif</h2>
              <div style={styles.iconCircleGreen}>
                <FileText size={20} color="#10b981" />
              </div>
            </div>
            <strong style={styles.templateName}>{template.title}</strong>
            <p style={styles.statSubtitle}>{template.questions.length} pertanyaan terdaftar</p>
          </div>
        )}

        <div style={{...styles.statCard, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <div style={styles.statHeader}>
            <h2 style={styles.statTitle}>Export Data</h2>
            <div style={styles.iconCirclePurple}>
              <Download size={20} color="#8b5cf6" />
            </div>
          </div>
          <p style={{...styles.statSubtitle, marginBottom: '1.25rem'}}>Format CSV (STATA Compatible)</p>
          <a href="/api/export" style={styles.downloadBtn}>
            Download CSV
          </a>
        </div>
      </div>

      {/* Patient Scores Section */}
      <div style={styles.analyticsSection}>
        <div style={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.25rem' }}>
            <div style={styles.iconCirclePurple}>
              <CheckSquare size={20} color="#8b5cf6" />
            </div>
            <h2 style={styles.sectionTitle}>Skor Pasien (IMSA)</h2>
          </div>
          <p style={styles.sectionSubtitle}>
            Hasil perhitungan komposit (0-60) per responden berdasarkan inisial. Skor {'>'} 30 ditandai merah.
          </p>
        </div>
        <ScoreTable />
      </div>

      {/* Analytics charts */}
      {selectedInisial ? (
        <div style={styles.analyticsSection}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.25rem' }}>
              <div style={styles.iconCircleBlue}>
                <Users size={20} color="#3b82f6" />
              </div>
              <h2 style={styles.sectionTitle}>Analitik per Pertanyaan: {selectedInisial}</h2>
            </div>
            <p style={styles.sectionSubtitle}>
              Distribusi jawaban responden untuk setiap indikator IMSA.
            </p>
          </div>
          <AnalyticsDashboard inisial={selectedInisial} />
        </div>
      ) : (
        <div style={styles.analyticsSection}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.25rem' }}>
              <div style={styles.iconCircleBlue}>
                <Users size={20} color="#3b82f6" />
              </div>
              <h2 style={styles.sectionTitle}>Analitik per Pertanyaan</h2>
            </div>
          </div>
          <div style={styles.emptyState}>
             Klik salah satu inisial pasien pada tabel di atas untuk melihat detail analitik per pertanyaan.
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2.5rem 4rem',
    maxWidth: '1600px',
    margin: '0 auto',
    color: '#1e293b',
    fontFamily: "'Inter', sans-serif",
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid #e2e8f0',
  } as React.CSSProperties,
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  } as React.CSSProperties,
  logoBox: {
    width: '48px',
    height: '48px',
    backgroundColor: '#3b82f6',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)',
  } as React.CSSProperties,
  pageTitle: {
    fontSize: '32px',
    color: '#0f172a',
    margin: 0,
    fontWeight: 800,
    letterSpacing: '-0.03em',
    fontFamily: "'Outfit', sans-serif",
  } as React.CSSProperties,
  signOutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0.75rem 1.5rem',
    fontSize: '15px',
    fontWeight: 700,
    backgroundColor: 'white',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2rem',
  } as React.CSSProperties,
  statCard: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
    transition: 'transform 0.2s ease',
  } as React.CSSProperties,
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  statTitle: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: 700,
    margin: 0,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  iconCircleBlue: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  iconCircleGreen: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  iconCirclePurple: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#f5f3ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  statValue: {
    fontSize: '56px',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1,
    marginBottom: '0.75rem',
    letterSpacing: '-0.04em',
    fontFamily: "'Outfit', sans-serif",
  } as React.CSSProperties,
  templateName: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0f172a',
    display: 'block',
    marginBottom: '0.75rem',
    fontFamily: "'Outfit', sans-serif",
  } as React.CSSProperties,
  statSubtitle: {
    fontSize: '15px',
    color: '#94a3b8',
    margin: 0,
    fontWeight: 500,
  } as React.CSSProperties,
  downloadBtn: {
    display: 'inline-block',
    width: '100%',
    textAlign: 'center' as const,
    padding: '1rem 1.5rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    textDecoration: 'none',
    fontWeight: 700,
    borderRadius: '16px',
    fontSize: '16px',
    transition: 'all 0.2s',
    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)',
  } as React.CSSProperties,
  analyticsSection: {
    marginTop: '4rem',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '32px',
    padding: '3rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
  } as React.CSSProperties,
  sectionHeader: {
    marginBottom: '2.5rem',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 0.5rem 0',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  sectionSubtitle: {
    color: '#64748b',
    fontSize: '1.1rem',
    margin: 0,
    lineHeight: 1.6,
  },
  emptyState: {
    padding: '5rem 2rem',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '1.1rem',
    fontWeight: 500,
    backgroundColor: '#f8fafc',
    borderRadius: '24px',
    border: '2px dashed #cbd5e1',
    marginTop: '2rem',
  } as React.CSSProperties,
}
