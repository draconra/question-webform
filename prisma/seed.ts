import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with full IMSA questionnaire...')

  // Check if template already exists to prevent data loss via cascade deletes
  const existingTemplate = await prisma.formTemplate.findFirst({
    where: { title: 'IMSA Questionnaire' }
  })

  if (existingTemplate) {
    console.log('IMSA Questionnaire template already exists. Skipping seed to prevent data loss.')
    return
  }

  // Create IMSA Template
  const imsaTemplate = await prisma.formTemplate.create({
    data: {
      title: 'IMSA Questionnaire',
      description: 'International Multimorbidity and Severity Assessment (IMSA) — Kuesioner untuk menilai tingkat keparahan kondisi kesehatan Anda secara menyeluruh.',
    },
  })

  const questions = [
    // --- Identitas ---
    {
      variableName: 'jenis_kelamin',
      type: 'radio',
      prompt: 'Jenis Kelamin',
      options: JSON.stringify([
        { label: 'Laki-laki', value: 1 },
        { label: 'Perempuan', value: 2 },
      ]),
      orderIndex: 1,
      required: true,
    },
    {
      variableName: 'usia',
      type: 'number',
      prompt: 'Usia (tahun)',
      orderIndex: 2,
      required: true,
    },
    {
      variableName: 'tingkat_pendidikan',
      type: 'radio',
      prompt: 'Tingkat Pendidikan',
      options: JSON.stringify([
        { label: 'SD', value: 1 },
        { label: 'SMP', value: 2 },
        { label: 'SMA', value: 3 },
        { label: 'Diploma/Sarjana', value: 4 },
        { label: 'Pascasarjana', value: 5 },
      ]),
      orderIndex: 3,
      required: true,
    },
    {
      variableName: 'status_pernikahan',
      type: 'radio',
      prompt: 'Status Pernikahan',
      options: JSON.stringify([
        { label: 'Menikah', value: 1 },
        { label: 'Belum Menikah', value: 2 },
      ]),
      orderIndex: 4,
      required: true,
    },
    {
      variableName: 'pekerjaan',
      type: 'radio',
      prompt: 'Pekerjaan',
      options: JSON.stringify([
        { label: 'Karyawan swasta', value: 1 },
        { label: 'Wiraswasta', value: 2 },
        { label: 'PNS', value: 3 },
        { label: 'TNI/POLRI', value: 4 },
        { label: 'Guru', value: 5 },
        { label: 'Petani', value: 6 },
        { label: 'Nelayan', value: 7 },
        { label: 'Lainnya', value: 8 },
      ]),
      orderIndex: 5,
      required: true,
    },
    {
      variableName: 'status_bpjs',
      type: 'radio',
      prompt: 'Status Pembiayaan BPJS',
      options: JSON.stringify([
        { label: 'PBI', value: 1 },
        { label: 'Non-PBI', value: 2 },
        { label: 'Mandiri/Tidak memiliki BPJS', value: 3 },
      ]),
      orderIndex: 6,
      required: true,
    },
    {
      variableName: 'jumlah_penyakit_kronis',
      type: 'number',
      prompt: 'Jumlah Penyakit Kronis yang dimiliki',
      orderIndex: 7,
      required: true,
    },
    {
      variableName: 'jenis_penyakit_kronis',
      type: 'checkbox',
      prompt: 'Jenis Penyakit Kronis',
      options: JSON.stringify([
        { label: 'Hipertensi', value: 'hipertensi' },
        { label: 'DM/Gula', value: 'dm_gula' },
        { label: 'Stroke', value: 'stroke' },
        { label: 'Penyakit Jantung', value: 'penyakit_jantung' },
        { label: 'Penyakit Ginjal', value: 'penyakit_ginjal' },
        { label: 'Kanker', value: 'kanker' },
        { label: 'Penyakit Sendi', value: 'penyakit_sendi' },
        { label: 'Penyakit Paru', value: 'penyakit_paru' },
        { label: 'Lainnya', value: 'lainnya' },
      ]),
      orderIndex: 8,
      required: true,
    },
    {
      variableName: 'durasi_penyakit_kronis',
      type: 'number',
      prompt: 'Durasi Penyakit Kronis (dalam tahun)',
      orderIndex: 9,
      required: true,
    },
    {
      variableName: 'jumlah_obat_rutin',
      type: 'number',
      prompt: 'Jumlah Obat yang dikonsumsi secara rutin setiap harinya',
      orderIndex: 10,
      required: true,
    },

    // --- Utilisasi Layanan Kesehatan ---
    {
      variableName: 'frekuensi_kunjungan_fktp',
      type: 'number',
      prompt: 'Rata-rata frekuensi kunjungan FKTP per bulan, dalam 1 tahun terakhir',
      orderIndex: 11,
      required: true,
    },
    {
      variableName: 'frekuensi_kunjungan_fktl',
      type: 'number',
      prompt: 'Rata-rata frekuensi kunjungan FKTL (RS) per bulan, dalam 1 tahun terakhir',
      orderIndex: 12,
      required: true,
    },
    {
      variableName: 'riwayat_rawat_inap',
      type: 'number',
      prompt: 'Riwayat rawat inap dalam 1 tahun terakhir (jumlah kali)',
      orderIndex: 13,
      required: true,
    },

    // --- PRA ---
    {
      variableName: 'pra_1_kemampuan_bahasa',
      type: 'radio',
      prompt: 'PRA-1: Bagaimana tingkat pemahaman Anda terhadap bahasa di negara tempat Anda tinggal?',
      options: JSON.stringify([
        { label: 'Penutur asli', value: 0 },
        { label: 'Pengetahuan bahasa baik', value: 1 },
        { label: 'Pengetahuan bahasa menengah', value: 2 },
        { label: 'Pengetahuan bahasa buruk', value: 3 },
      ]),
      orderIndex: 14,
      required: true,
    },
    {
      variableName: 'pra_2_pengisi_kuesioner',
      type: 'radio',
      prompt: 'PRA-2: Siapa yang mengisi kuesioner ini?',
      options: JSON.stringify([
        { label: 'Saya mengisi sendiri', value: 1 },
        { label: 'Saya mengisi sendiri meskipun dibantu orang lain', value: 2 },
        { label: 'Orang lain mengisi setelah berkonsultasi dengan saya', value: 3 },
      ]),
      orderIndex: 15,
      required: true,
    },

    // --- Riwayat Kronik Biologis ---
    {
      variableName: 'hist_1a_masalah_fisik',
      type: 'radio',
      prompt: '1a: Apakah Anda mengalami masalah fisik dalam 5 tahun terakhir?',
      options: JSON.stringify([
        { label: 'Tidak, saya tidak mengalaminya', value: 0 },
        { label: 'Ya, tetapi kurang dari 3 bulan', value: 0 },
        { label: 'Ya, selama lebih dari 3 bulan', value: 1 },
        { label: 'Ya, beberapa periode singkat masalah fisik dalam 5 tahun', value: 1 },
      ]),
      orderIndex: 16,
      required: true,
    },
    {
      variableName: 'hist_1b_penyakit_kronis',
      type: 'radio',
      prompt: '1b: Apakah Anda menderita satu atau lebih penyakit jangka panjang atau kronis (seperti diabetes, hipertensi, reumatoid artritis, penyakit paru-paru, atau kanker)?',
      options: JSON.stringify([
        { label: 'Tidak, tidak ada penyakit kronis', value: 0 },
        { label: 'Ya, satu penyakit kronis', value: 2 },
        { label: 'Ya, beberapa penyakit kronis', value: 3 },
      ]),
      orderIndex: 17,
      required: true,
    },

    // --- Riwayat Dilema Diagnostik ---
    {
      variableName: 'hist_2_dilema_diagnostik',
      type: 'radio',
      prompt: '2: Seberapa sulitkah dalam 5 tahun terakhir untuk mendiagnosis masalah fisik yang Anda alami?',
      options: JSON.stringify([
        { label: 'Saya tidak menderita masalah fisik apapun dalam 5 tahun terakhir', value: 0 },
        { label: 'Alasan masalah saya langsung jelas', value: 0 },
        { label: 'Setelah beberapa pemeriksaan rutin, masalah saya teridentifikasi', value: 1 },
        { label: 'Setelah banyak pemeriksaan, masalah saya teridentifikasi', value: 2 },
        { label: 'Meskipun serangkaian pemeriksaan, penyebab masalah saya tidak pernah terdiagnosis', value: 3 },
      ]),
      orderIndex: 18,
      required: true,
    },

    // --- Saat ini: Tingkat Keparahan Gejala ---
    {
      variableName: 'saat_ini_3_keparahan_gejala',
      type: 'radio',
      prompt: '3: Seberapa banyak aktivitas sehari-hari Anda dibatasi oleh masalah fisik selama seminggu terakhir?',
      options: JSON.stringify([
        { label: 'Tidak ada masalah fisik atau tidak signifikan', value: 0 },
        { label: 'Tidak atau hanya sedikit dipengaruhi masalah fisik', value: 1 },
        { label: 'Cukup dipengaruhi masalah fisik', value: 2 },
        { label: 'Sangat dipengaruhi masalah fisik', value: 3 },
      ]),
      orderIndex: 19,
      required: true,
    },

    // --- Saat ini: Tantangan Diagnostik ---
    {
      variableName: 'saat_ini_4a_pemahaman_dokter',
      type: 'radio',
      prompt: '4a: Apakah menurut Anda dokter Anda memahami penyebab masalah fisik Anda saat ini?',
      options: JSON.stringify([
        { label: 'Saya tidak mempunyai masalah fisik saat ini', value: 0 },
        { label: 'Dokter saya memahami penyebab masalah fisik saya', value: 1 },
        { label: 'Dokter saya memahami tetapi memiliki beberapa keraguan', value: 2 },
        { label: 'Dokter saya mempunyai banyak keraguan tentang penyebab masalah saya', value: 3 },
        { label: 'Dokter saya masih harus mencari tahu penyebab masalah fisik saya', value: 3 },
      ]),
      orderIndex: 20,
      required: true,
    },
    {
      variableName: 'saat_ini_4b_pengobatan_tepat',
      type: 'radio',
      prompt: '4b: Apakah Anda merasa menerima pengobatan yang tepat untuk masalah fisik Anda saat ini?',
      options: JSON.stringify([
        { label: 'Saya tidak mempunyai masalah fisik saat ini', value: 0 },
        { label: 'Saya menerima perawatan yang sesuai', value: 1 },
        { label: 'Saya ragu mengenai kelayakan pengobatan saat ini', value: 2 },
        { label: 'Saya mempunyai banyak keraguan tentang kelayakan pengobatan', value: 3 },
        { label: 'Pengobatan yang tepat masih belum ditemukan', value: 3 },
      ]),
      orderIndex: 21,
      required: true,
    },

    // --- Historis: Cara Mengatasi ---
    {
      variableName: 'hist_5_cara_mengatasi',
      type: 'radio',
      prompt: '5: Dalam 5 tahun terakhir, bagaimana Anda mengatasi situasi yang penuh tekanan dan sulit?',
      options: JSON.stringify([
        { label: 'Secara umum, saya selalu mampu mengatasi situasi yang penuh tekanan', value: 0 },
        { label: 'Terkadang saya mengalami kesulitan dan ini kadang menimbulkan ketegangan dengan orang lain', value: 1 },
        { label: 'Saya sering mengalami kesulitan yang sering menyebabkan ketegangan dengan orang lain', value: 2 },
        { label: 'Saya selalu mengalami kesulitan dalam situasi penuh tekanan dan mereka membuat saya tegang', value: 3 },
      ]),
      orderIndex: 22,
      required: true,
    },

    // --- Historis: Kesehatan Mental ---
    {
      variableName: 'hist_6_kesehatan_mental',
      type: 'radio',
      prompt: '6: Di masa lalu, apakah Anda pernah mengalami masalah psikologis seperti tegang, cemas, sedih, atau bingung?',
      options: JSON.stringify([
        { label: 'Tidak, hampir tidak pernah', value: 0 },
        { label: 'Ya, namun tanpa pengaruh yang jelas pada kehidupan sehari-hari', value: 1 },
        { label: 'Ya dan itu mempengaruhi kehidupan sehari-hari saya', value: 2 },
        { label: 'Ya dan masalah ini telah atau masih berdampak jangka panjang pada kehidupan sehari-hari saya', value: 3 },
      ]),
      orderIndex: 23,
      required: true,
    },

    // --- Saat ini: Resistensi Pengobatan ---
    {
      variableName: 'saat_ini_7_resistensi_pengobatan',
      type: 'radio',
      prompt: '7: Apakah menurut Anda sulit untuk mengikuti rekomendasi penyedia layanan kesehatan Anda?',
      options: JSON.stringify([
        { label: 'Tidak, menurut saya ini tidak sulit', value: 0 },
        { label: 'Ya, sulit, tapi saya bisa mengatasinya', value: 1 },
        { label: 'Ya, sulit, kadang saya bisa, kadang tidak', value: 2 },
        { label: 'Ya, terlalu sulit, sering kali saya tidak berhasil', value: 3 },
      ]),
      orderIndex: 24,
      required: true,
    },

    // --- Saat ini: Gejala Kesehatan Mental ---
    {
      variableName: 'saat_ini_8_gejala_mental',
      type: 'radio',
      prompt: '8: Saat ini apakah anda sedang mengalami gangguan psikologis seperti tegang, cemas, down/blue, atau bingung?',
      options: JSON.stringify([
        { label: 'Tidak, tidak ada masalah', value: 0 },
        { label: 'Ya, masalah ringan yang tidak mempengaruhi aktivitas sehari-hari', value: 1 },
        { label: 'Ya, masalah sedang yang sedikit mempengaruhi aktivitas sehari-hari', value: 2 },
        { label: 'Ya, masalah parah yang sangat mempengaruhi aktivitas sehari-hari', value: 3 },
      ]),
      orderIndex: 25,
      required: true,
    },

    // --- Historis: Pekerjaan dan Waktu Luang ---
    {
      variableName: 'hist_9a_memiliki_pekerjaan',
      type: 'radio',
      prompt: '9a: Apakah Anda mempunyai pekerjaan?',
      options: JSON.stringify([
        { label: 'Ya', value: 1 },
        { label: 'Tidak', value: 0 },
      ]),
      orderIndex: 26,
      required: true,
    },
    {
      variableName: 'hist_9c_kegiatan_luang',
      type: 'radio',
      prompt: '9c: Apakah Anda mempunyai kegiatan di waktu luang seperti menjadi sukarelawan, kursus, olah raga, klub?',
      options: JSON.stringify([
        { label: 'Ya', value: 1 },
        { label: 'Tidak', value: 0 },
      ]),
      orderIndex: 27,
      required: true,
    },

    // --- Historis: Hubungan Sosial ---
    {
      variableName: 'hist_10_hubungan_sosial',
      type: 'radio',
      prompt: '10: Bagaimana biasanya Anda berhubungan dengan orang lain?',
      options: JSON.stringify([
        { label: 'Saya memiliki cukup banyak kontak dengan orang lain dan bersosialisasi dengan baik', value: 0 },
        { label: 'Saya mempunyai kontak dengan orang lain, meskipun kadang-kadang menjadi tegang', value: 1 },
        { label: 'Sulit bagi saya untuk memulai atau mempertahankan kontak atau persahabatan', value: 2 },
        { label: 'Kontak atau persahabatan sering memburuk menjadi pertengkaran dan konflik', value: 3 },
      ]),
      orderIndex: 28,
      required: true,
    },

    // --- Saat ini: Stabilitas Tempat Tinggal ---
    {
      variableName: 'saat_ini_11_stabilitas_tempat_tinggal',
      type: 'radio',
      prompt: '11: Apakah situasi kehidupan di rumah Anda memuaskan? Atau apakah diperlukan penyesuaian?',
      options: JSON.stringify([
        { label: 'Tidak perlu penyesuaian, saya dapat mengatur situasi rumah saya', value: 0 },
        { label: 'Tidak diperlukan penyesuaian, karena dukungan dari orang lain sudah cukup', value: 1 },
        { label: 'Penyesuaian diperlukan, namun tidak segera', value: 2 },
        { label: 'Diperlukan penyesuaian segera', value: 3 },
      ]),
      orderIndex: 29,
      required: true,
    },

    // --- Saat ini: Dukungan Sosial ---
    {
      variableName: 'saat_ini_12_dukungan_sosial',
      type: 'radio',
      prompt: '12: Apakah bantuan dari pasangan, keluarga, kolega, atau teman Anda tersedia kapan saja?',
      options: JSON.stringify([
        { label: 'Saya tidak membutuhkan bantuan', value: 0 },
        { label: 'Ya, bantuan tersedia setiap saat', value: 0 },
        { label: 'Ya, bantuan tersedia tetapi tidak setiap saat', value: 1 },
        { label: 'Bantuan yang saya dapatkan sangat terbatas', value: 2 },
        { label: 'Tidak ada bantuan yang tersedia', value: 3 },
      ]),
      orderIndex: 30,
      required: true,
    },

    // --- Historis: Akses Perawatan ---
    {
      variableName: 'hist_13_akses_perawatan',
      type: 'radio',
      prompt: '13: Apakah Anda mengalami kesulitan dalam mendapatkan layanan yang dibutuhkan karena jarak, asuransi, bahasa, atau perbedaan budaya?',
      options: JSON.stringify([
        { label: 'Tidak, ini bukan masalah bagi saya', value: 0 },
        { label: 'Ya, saya kadang-kadang mengalami beberapa masalah ini', value: 1 },
        { label: 'Ya, beberapa masalah ini sering saya alami', value: 2 },
        { label: 'Ya, beberapa di antaranya adalah masalah besar bagi saya', value: 3 },
      ]),
      orderIndex: 31,
      required: true,
    },

    // --- Historis: Pengalaman Pengobatan ---
    {
      variableName: 'hist_14_pengalaman_pengobatan',
      type: 'radio',
      prompt: '14: Bagaimana pengalaman Anda dengan dokter dan penyedia layanan kesehatan?',
      options: JSON.stringify([
        { label: 'Saya tidak pernah mempunyai masalah dengan dokter dan penyedia layanan kesehatan', value: 0 },
        { label: 'Saya atau seseorang yang dekat saya mempunyai pengalaman negatif', value: 1 },
        { label: 'Saya telah berganti dokter karena pengalaman negatif', value: 2 },
        { label: 'Saya sering berganti dokter karena pengalaman negatif atau kurangnya kepercayaan', value: 3 },
      ]),
      orderIndex: 32,
      required: true,
    },

    // --- Saat ini: Koordinasi Perawatan ---
    {
      variableName: 'saat_ini_16_koordinasi_perawatan',
      type: 'radio',
      prompt: '16: Sejauh mana dokter dan penyedia layanan kesehatan Anda bekerja sama?',
      options: JSON.stringify([
        { label: 'Saya tidak menerima perawatan atau hanya dari satu dokter', value: 0 },
        { label: 'Dokter dan penyedia layanan kesehatan saya bekerja sama dengan baik', value: 0 },
        { label: 'Bekerja sama, namun terkadang perlu lebih banyak komunikasi', value: 1 },
        { label: 'Tidak bekerja sama dengan baik, kadang menimbulkan masalah', value: 2 },
        { label: 'Dokter dan penyedia layanan kesehatan saya tidak bekerja sama', value: 3 },
      ]),
      orderIndex: 33,
      required: true,
    },

    // --- Prognosis: Komplikasi dan Ancaman ---
    {
      variableName: 'prog_17_perkiraan_fisik',
      type: 'radio',
      prompt: '17: Dalam 6 bulan ke depan, apakah Anda memperkirakan kesehatan fisik Anda akan berubah?',
      options: JSON.stringify([
        { label: 'Saya berharap kesehatan fisik saya tetap sama atau membaik', value: 0 },
        { label: 'Saya memperkirakan kesehatan fisik saya akan sedikit memburuk', value: 1 },
        { label: 'Saya memperkirakan kesehatan fisik saya akan memburuk', value: 2 },
        { label: 'Saya memperkirakan kesehatan fisik saya akan semakin memburuk', value: 3 },
      ]),
      orderIndex: 34,
      required: true,
    },

    // --- Prognosis: Ancaman Kesehatan Mental ---
    {
      variableName: 'prog_18_perkiraan_mental',
      type: 'radio',
      prompt: '18: Dalam 6 bulan ke depan, apakah Anda memperkirakan kesejahteraan psikologis Anda akan berubah?',
      options: JSON.stringify([
        { label: 'Saya berharap kesejahteraan psikologis saya tetap sama atau menjadi lebih baik', value: 0 },
        { label: 'Saya memperkirakan kesejahteraan psikologis saya akan sedikit memburuk', value: 1 },
        { label: 'Saya memperkirakan kesejahteraan psikologis saya akan memburuk', value: 2 },
        { label: 'Saya memperkirakan kesejahteraan psikologis saya akan semakin memburuk', value: 3 },
      ]),
      orderIndex: 35,
      required: true,
    },

    // --- Prognosis: Kerentanan Sosial ---
    {
      variableName: 'prog_19_perkiraan_sosial',
      type: 'radio',
      prompt: '19: Dalam 6 bulan ke depan, apakah Anda mengharapkan perubahan terhadap cara hidup Anda saat ini?',
      options: JSON.stringify([
        { label: 'Dalam 6 bulan ke depan tidak perlu mengubah cara hidup saya saat ini', value: 0 },
        { label: 'Saya bisa tinggal di situasi saat ini, namun perawatan di rumah diperlukan', value: 1 },
        { label: 'Diperlukan perubahan situasi kehidupan yang lain', value: 2 },
        { label: 'Perubahan pada situasi kehidupan diperlukan segera', value: 3 },
      ]),
      orderIndex: 36,
      required: true,
    },

    // --- Prognosis: Hambatan Sistem Kesehatan ---
    {
      variableName: 'prog_20_kebutuhan_perawatan',
      type: 'radio',
      prompt: '20: Bagaimana perkiraan kebutuhan perawatan Anda dalam 6 bulan ke depan?',
      options: JSON.stringify([
        { label: 'Saya perkirakan kebutuhan perawatan saya akan tetap sama atau berkurang', value: 0 },
        { label: 'Saya perkirakan kebutuhan perawatan saya akan meningkat', value: 1 },
        { label: 'Saya perkirakan kebutuhan perawatan saya akan meningkat pesat', value: 2 },
        { label: 'Saya berharap kebutuhan perawatan akan meningkat pesat dan layanan tambahan akan diperlukan', value: 3 },
      ]),
      orderIndex: 37,
      required: true,
    },
  ]

  for (const q of questions) {
    await prisma.question.create({
      data: {
        ...q,
        formTemplateId: imsaTemplate.id,
      },
    })
  }

  console.log(`Seed completed: ${questions.length} questions created.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
