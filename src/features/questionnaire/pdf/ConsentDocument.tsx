import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { ConsentResponse } from '../repository'
import { UGM_LOGO_DATA_URI } from './ugmLogo'

/**
 * Signed consent PDF ("LEMBAR PERSETUJUAN") for a single response — admin-only download.
 * Static content (title, team, bullets) is copied verbatim from the on-screen consent
 * step in Wizard.tsx so this stays the source-of-truth copy of what the respondent saw.
 * Server-only module — never import into a client component.
 */

const RESEARCH_TITLE =
  'Beyond Disease Counts : A Quantitative Analysis of Complexity Patterns in ' +
  'Multimorbid Patient Populations in Yogyakarta using the Indonesian Version of ' +
  'Intermed-SA Questionnare'

const TEAM = [
  'dr. Aghnaa Gayatri, M.Sc, PhD, Sp.KKLP, Subsp.FOMC',
  'Prof. dr. Hari Koesnanto Josep, MPH, DrPH, Sp.KKLP',
  'Dr. dr. Wahyudi Istiono, M.Kes, Sp.KKLP Subsp. COPC',
  'dr. Aulia Astagina Rahmadini',
]

const BULLETS = (signedDateLong: string) => [
  `Saya telah membaca dan memahami informasi pada lembar informasi tertanggal ${signedDateLong} ` +
    'untuk penelitian di atas dan sudah diberikan kesempatan untuk bertanya.',
  'Saya memahami bahwa keikutsertaan saya bersifat sukarela dan saya bebas mengundurkan diri ' +
    'kapanpun, tanpa alasan, tanpa ada pengaruh terhadap hak-hak legal saya.',
  'Saya setuju untuk data saya disimpan secara anonim dan versi elektronik dari data tersebut ' +
    'akan disimpan dalam komputer yang terkunci dengan kata sandi.',
  'Saya memahami bahwa informasi yang saya berikan akan disimpan untuk penelitian selanjutnya ' +
    'dan tidak akan dapat teridentifikasi pada analisis yang dilakukan.',
  'Saya memahami bahwa hasil analisis penelitian ini akan ditampilkan dalam laporan atau ' +
    'publikasi ilmiah, hal ini akan dilakukan dengan memastikan bahwa identitas saya tidak ' +
    'dapat teridentifikasi.',
  'Saya setuju untuk ikut serta dalam penelitian ini.',
]

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10.5, fontFamily: 'Helvetica', color: '#0f172a', lineHeight: 1.4 },
  header: { alignItems: 'center', marginBottom: 10 },
  logo: { width: 58, height: 58, objectFit: 'contain' },
  headerRule: { borderBottomWidth: 1, borderBottomColor: '#cbd5e1', marginBottom: 14 },
  title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  label: { fontSize: 10.5, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  text: { marginBottom: 2 },
  fieldRow: { flexDirection: 'row', marginBottom: 2 },
  fieldLabel: { width: 70 },
  bulletRow: { flexDirection: 'row', marginBottom: 6, paddingRight: 4 },
  bulletMark: { width: 12 },
  bulletText: { flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  footerCol: { flex: 1, paddingHorizontal: 6, alignItems: 'center' },
  footerDateLine: { fontSize: 9.5, marginBottom: 8 },
  signatureBox: { height: 60, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  signatureImage: { height: 55, objectFit: 'contain' },
  signatureUnderline: { borderTopWidth: 1, borderTopColor: '#0f172a', width: '90%', marginTop: 4 },
  footerName: { fontSize: 9.5, marginTop: 4, textAlign: 'center' },
  footerRole: { fontSize: 9.5, marginTop: 2, textAlign: 'center' },
})

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ConsentDocument({ data }: { data: ConsentResponse }) {
  const signedDateLong = formatDateLong(new Date(data.createdAt))

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is a PDF-drawing primitive, not an HTML <img>; no `alt` prop exists on its type. */}
          <Image src={UGM_LOGO_DATA_URI} style={styles.logo} />
        </View>
        <View style={styles.headerRule} />

        <Text style={styles.title}>LEMBAR PERSETUJUAN</Text>

        <Text style={styles.label}>Judul Penelitian:</Text>
        <Text style={styles.text}>{RESEARCH_TITLE}</Text>

        <Text style={styles.label}>Tim Peneliti:</Text>
        {TEAM.map((name) => (
          <Text key={name} style={styles.text}>{name}</Text>
        ))}

        <Text style={styles.label}>Saya yang bertanda tangan di bawah ini :</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Nama</Text>
          <Text>: {data.nama ?? '-'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Alamat</Text>
          <Text>: {data.alamat ?? '-'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>No HP</Text>
          {/* Only the masked form is ever stored — the original number is never recoverable. */}
          <Text>: {data.noTelp ?? '-'}</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          {BULLETS(signedDateLong).map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletMark}>•</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          {/* Column 1: respondent — the ONLY column that ever carries a signature image. */}
          <View style={styles.footerCol}>
            <Text style={styles.footerDateLine}>………………, {signedDateLong}</Text>
            <View style={styles.signatureBox}>
              {data.signature ? (
                // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is a PDF-drawing primitive, not an HTML <img>; no `alt` prop exists on its type.
                <Image src={data.signature} style={styles.signatureImage} />
              ) : (
                <View style={styles.signatureUnderline} />
              )}
            </View>
            <View style={styles.signatureUnderline} />
            <Text style={styles.footerName}>( {data.nama ?? ''} )</Text>
            <Text style={styles.footerRole}>Nama Responden</Text>
          </View>

          {/* Column 2 & 3: manual wet-ink placeholders — the app never captures these signatures. */}
          <View style={styles.footerCol}>
            <Text style={styles.footerDateLine}>………………, ………………. 2026</Text>
            <View style={styles.signatureBox}>
              <View style={styles.signatureUnderline} />
            </View>
            <View style={styles.signatureUnderline} />
            <Text style={styles.footerName}>(                              )</Text>
            <Text style={styles.footerRole}>Nama Pengambil Persetujuan</Text>
            <Text style={styles.footerRole}>(Jika berbeda dari peneliti)</Text>
          </View>

          <View style={styles.footerCol}>
            <Text style={styles.footerDateLine}>………………, ………………. 2026</Text>
            <View style={styles.signatureBox}>
              <View style={styles.signatureUnderline} />
            </View>
            <View style={styles.signatureUnderline} />
            <Text style={styles.footerName}>(                              )</Text>
            <Text style={styles.footerRole}>Peneliti</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
