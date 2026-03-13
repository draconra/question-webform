import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { QuestionnaireService, PrismaQuestionnaireRepository } from "@/features/questionnaire"
import AnalyticsDashboard from "@/features/questionnaire/components/AnalyticsDashboard"
import ScoreTable from "@/features/questionnaire/components/ScoreTable"
import { Users, FileText, Download, LayoutDashboard, LogOut, CheckSquare } from "lucide-react"

export default async function AdminDashboard() {
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
      <div style={styles.analyticsSection}>
        <div style={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.25rem' }}>
            <div style={styles.iconCircleBlue}>
              <Users size={20} color="#3b82f6" />
            </div>
            <h2 style={styles.sectionTitle}>Analitik per Pertanyaan</h2>
          </div>
          <p style={styles.sectionSubtitle}>
            Distribusi jawaban responden untuk setiap indikator IMSA.
          </p>
        </div>
        <AnalyticsDashboard />
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem 3rem',
    maxWidth: '1440px',
    margin: '0 auto',
    color: '#111827',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
  } as React.CSSProperties,
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  } as React.CSSProperties,
  logoBox: {
    width: '40px',
    height: '40px',
    backgroundColor: '#0056b3',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px rgba(0, 86, 179, 0.2)',
  } as React.CSSProperties,
  pageTitle: {
    fontSize: '28px',
    color: '#0f172a',
    margin: 0,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  signOutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0.6rem 1.2rem',
    fontSize: '15px',
    fontWeight: 600,
    backgroundColor: 'white',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
  } as React.CSSProperties,
  statCard: {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02)',
  } as React.CSSProperties,
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  } as React.CSSProperties,
  statTitle: {
    fontSize: '15px',
    color: '#64748b',
    fontWeight: 600,
    margin: 0,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  iconCircleBlue: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  iconCircleGreen: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  iconCirclePurple: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#f5f3ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  statValue: {
    fontSize: '48px',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1,
    marginBottom: '0.5rem',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  templateName: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    display: 'block',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  statSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  } as React.CSSProperties,
  downloadBtn: {
    display: 'inline-block',
    width: '100%',
    textAlign: 'center' as const,
    padding: '0.875rem 1.5rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    textDecoration: 'none',
    fontWeight: 600,
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
  } as React.CSSProperties,
  analyticsSection: {
    marginTop: '3rem',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
  } as React.CSSProperties,
  sectionHeader: {
    marginBottom: '2rem',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 0.25rem 0',
  } as React.CSSProperties,
  sectionSubtitle: {
    color: '#64748b',
    fontSize: '15px',
    margin: 0,
  } as React.CSSProperties,
}
