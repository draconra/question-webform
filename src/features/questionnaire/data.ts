export interface SeedQuestion {
  variableName: string;
  type: string;
  prompt: string;
  options?: any[];
  orderIndex: number;
  required: boolean;
}

export const IMSA_QUESTIONS: SeedQuestion[] = [
  // --- Identitas ---
  {
    variableName: 'jenis_kelamin',
    type: 'radio',
    prompt: 'Jenis Kelamin',
    options: [
      { label: 'Laki-laki', value: 1 },
      { label: 'Perempuan', value: 2 },
    ],
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
    options: [
      { label: 'SD', value: 1 },
      { label: 'SMP', value: 2 },
      { label: 'SMA', value: 3 },
      { label: 'Diploma/Sarjana', value: 4 },
      { label: 'Pascasarjana', value: 5 },
    ],
    orderIndex: 3,
    required: true,
  },
  {
    variableName: 'status_pernikahan',
    type: 'radio',
    prompt: 'Status Pernikahan',
    options: [
      { label: 'Menikah', value: 1 },
      { label: 'Belum Menikah', value: 2 },
    ],
    orderIndex: 4,
    required: true,
  },
  {
    variableName: 'pekerjaan',
    type: 'radio',
    prompt: 'Pekerjaan',
    options: [
      { label: 'Karyawan swasta', value: 1 },
      { label: 'Wiraswasta', value: 2 },
      { label: 'PNS', value: 3 },
      { label: 'TNI/POLRI', value: 4 },
      { label: 'Guru', value: 5 },
      { label: 'Petani', value: 6 },
      { label: 'Nelayan', value: 7 },
      { label: 'Lainnya', value: 8, requiresText: true },
    ],
    orderIndex: 5,
    required: true,
  },
  // Companion: pekerjaan Lainnya → never shown as standalone step
  {
    variableName: 'pekerjaan_lainnya',
    type: 'text',
    prompt: 'Pekerjaan lainnya (sebutkan)',
    orderIndex: 6,
    required: false,
  },
  {
    variableName: 'status_bpjs',
    type: 'radio',
    prompt: 'Status Pembiayaan BPJS',
    options: [
      { label: 'PBI/dibayarkan Pemerintah', value: 1 },
      { label: 'Non-PBI', value: 2 },
      { label: 'Mandiri/Tidak memiliki BPJS', value: 3 },
    ],
    orderIndex: 7,
    required: true,
  },
  {
    variableName: 'jumlah_penyakit_kronis',
    type: 'number',
    prompt: 'Jumlah Penyakit Kronis yang dimiliki',
    orderIndex: 8,
    required: true,
  },
  {
    variableName: 'jenis_penyakit_kronis',
    type: 'checkbox',
    prompt: 'Jenis Penyakit Kronis',
    options: [
      { label: 'Hipertensi', value: 'hipertensi' },
      { label: 'DM/Gula', value: 'dm_gula' },
      { label: 'Stroke', value: 'stroke' },
      { label: 'Penyakit Jantung', value: 'penyakit_jantung' },
      { label: 'Penyakit Ginjal', value: 'penyakit_ginjal' },
      { label: 'Kanker', value: 'kanker' },
      { label: 'Penyakit Sendi', value: 'penyakit_sendi' },
      { label: 'Penyakit Paru', value: 'penyakit_paru' },
      { label: 'Lainnya', value: 'lainnya', requiresText: true },
    ],
    orderIndex: 9,
    required: true,
  },
  // Companion: jenis_penyakit_kronis Lainnya → never shown as standalone step
  {
    variableName: 'jenis_penyakit_kronis_lainnya',
    type: 'text',
    prompt: 'Jenis penyakit kronis lainnya (sebutkan)',
    orderIndex: 10,
    required: false,
  },
  {
    variableName: 'durasi_penyakit_kronis',
    type: 'number',
    prompt: 'Durasi Penyakit Kronis (dalam tahun)',
    orderIndex: 11,
    required: true,
  },
  {
    variableName: 'jumlah_obat_rutin',
    type: 'number',
    prompt: 'Jumlah Obat yang dikonsumsi secara rutin setiap harinya',
    orderIndex: 12,
    required: true,
  },

  // --- Utilisasi Layanan Kesehatan ---
  {
    variableName: 'frekuensi_kunjungan_fktp',
    type: 'number',
    prompt: 'Rata-rata frekuensi kunjungan FKTP per bulan, dalam 1 tahun terakhir',
    orderIndex: 13,
    required: true,
  },
  {
    // Changed from number to radio buckets per PDF
    variableName: 'frekuensi_kunjungan_fktl',
    type: 'radio',
    prompt: 'Rata-rata frekuensi kunjungan FKTL (RS) dalam 1 tahun terakhir',
    options: [
      { label: '1 bulan sekali', value: 1 },
      { label: '2 kali atau lebih per bulan', value: 2 },
      { label: '3 bulan sekali atau lebih jarang', value: 3 },
    ],
    orderIndex: 14,
    required: true,
  },
  {
    variableName: 'riwayat_rawat_inap',
    type: 'number',
    prompt: 'Riwayat rawat inap dalam 1 tahun terakhir (jumlah kali)',
    orderIndex: 15,
    required: true,
  },

  // --- PRA ---
  {
    variableName: 'pra_1_kemampuan_bahasa',
    type: 'radio',
    prompt: 'PRA-1: Bagaimana tingkat pemahaman Anda terhadap bahasa di negara tempat Anda tinggal?',
    options: [
      { label: 'Pengetahuan bahasa mahir', value: 0 },
      { label: 'Pengetahuan bahasa baik', value: 1 },
      { label: 'Pengetahuan bahasa cukup', value: 2 },
      { label: 'Pengetahuan bahasa buruk', value: 3 },
    ],
    orderIndex: 16,
    required: true,
  },
  {
    variableName: 'pra_2_pengisi_kuesioner',
    type: 'radio',
    prompt: 'PRA-2: Siapa yang mengisi kuesioner ini?',
    options: [
      { label: 'Saya mengisi sendiri', value: 1 },
      { label: 'Saya mengisi sendiri meskipun dibantu orang lain', value: 2 },
      { label: 'Orang lain mengisi setelah berkonsultasi dengan saya', value: 3 },
    ],
    orderIndex: 17,
    required: true,
  },
  {
    // New: PRA-2 helper — who was the companion (if any)?
    variableName: 'pra_2_pendamping',
    type: 'radio',
    prompt: 'PRA-2 (lanjutan): Jika ada yang membantu pengisian, siapa pendamping Anda?',
    options: [
      { label: 'Tidak berlaku (saya mengisi sendiri)', value: 0 },
      { label: 'Anggota Keluarga/Pendamping/Teman', value: 1 },
      { label: 'Perawat', value: 2 },
      { label: 'Peneliti', value: 3 },
      { label: 'Lainnya', value: 4, requiresText: true },
    ],
    orderIndex: 18,
    required: true,
  },
  // Companion: pra_2_pendamping Lainnya → never shown as standalone step
  {
    variableName: 'pra_2_pendamping_lainnya',
    type: 'text',
    prompt: 'Pendamping lainnya (sebutkan)',
    orderIndex: 19,
    required: false,
  },

  // --- Tambahan ---
  {
    // New: Tamb.1 — routine daily medication count (unscored)
    variableName: 'tamb_1_minum_obat',
    type: 'radio',
    prompt: 'Tamb.1: Berapa jenis obat yang Anda minum secara rutin setiap harinya?',
    options: [
      { label: 'Tidak ada obat yang diminum secara rutin', value: 1 },
      { label: 'Satu jenis obat', value: 2 },
      { label: 'Beberapa jenis obat (lebih dari satu)', value: 3 },
    ],
    orderIndex: 20,
    required: true,
  },

  // --- Riwayat Kronik Biologis ---
  {
    variableName: 'hist_1a_masalah_fisik',
    type: 'radio',
    prompt: '1a: Apakah Anda mengalami masalah fisik dalam 5 tahun terakhir?',
    options: [
      { label: 'Tidak, saya tidak mengalaminya', value: 0 },
      { label: 'Ya, tetapi kurang dari 3 bulan', value: 0 },
      { label: 'Ya, selama lebih dari 3 bulan', value: 1 },
      { label: 'Ya, beberapa periode singkat masalah fisik dalam 5 tahun', value: 1 },
    ],
    orderIndex: 21,
    required: true,
  },
  {
    variableName: 'hist_1b_penyakit_kronis',
    type: 'radio',
    prompt: '1b: Apakah Anda menderita satu atau lebih penyakit jangka panjang atau kronis (seperti diabetes, hipertensi, reumatoid artritis, penyakit paru-paru, atau kanker)?',
    options: [
      { label: 'Tidak, tidak ada penyakit kronis', value: 0 },
      { label: 'Ya, satu penyakit kronis', value: 2 },
      { label: 'Ya, beberapa penyakit kronis', value: 3 },
    ],
    orderIndex: 22,
    required: true,
  },

  // --- Riwayat Dilema Diagnostik ---
  {
    variableName: 'hist_2_dilema_diagnostik',
    type: 'radio',
    prompt: '2: Seberapa sulitkah dalam 5 tahun terakhir untuk mendiagnosis masalah fisik yang Anda alami?',
    options: [
      { label: 'Saya tidak menderita masalah fisik apapun dalam 5 tahun terakhir', value: 0 },
      { label: 'Alasan masalah saya langsung jelas', value: 0 },
      { label: 'Setelah beberapa pemeriksaan rutin, masalah saya teridentifikasi', value: 1 },
      { label: 'Setelah banyak pemeriksaan, masalah saya teridentifikasi', value: 2 },
      { label: 'Meskipun serangkaian pemeriksaan, penyebab masalah saya tidak pernah terdiagnosis', value: 3 },
    ],
    orderIndex: 23,
    required: true,
  },

  // --- Saat ini: Tingkat Keparahan Gejala ---
  {
    variableName: 'saat_ini_3_keparahan_gejala',
    type: 'radio',
    prompt: '3: Seberapa banyak aktivitas sehari-hari Anda dibatasi oleh masalah fisik selama seminggu terakhir?',
    options: [
      { label: 'Tidak ada masalah fisik atau tidak signifikan', value: 0 },
      { label: 'Tidak atau hanya sedikit dipengaruhi masalah fisik', value: 1 },
      { label: 'Cukup dipengaruhi masalah fisik', value: 2 },
      { label: 'Sangat dipengaruhi masalah fisik', value: 3 },
    ],
    orderIndex: 24,
    required: true,
  },

  // --- Saat ini: Tantangan Diagnostik ---
  {
    variableName: 'saat_ini_4a_pemahaman_dokter',
    type: 'radio',
    prompt: '4a: Apakah menurut Anda dokter Anda memahami penyebab masalah fisik Anda saat ini?',
    options: [
      { label: 'Saya tidak mempunyai masalah fisik saat ini', value: 0 },
      { label: 'Dokter saya memahami penyebab masalah fisik saya', value: 1 },
      { label: 'Dokter saya memahami tetapi memiliki beberapa keraguan', value: 2 },
      { label: 'Dokter saya mempunyai banyak keraguan tentang penyebab masalah saya', value: 3 },
      { label: 'Dokter saya masih harus mencari tahu penyebab masalah fisik saya', value: 3 },
    ],
    orderIndex: 25,
    required: true,
  },
  {
    variableName: 'saat_ini_4b_pengobatan_tepat',
    type: 'radio',
    prompt: '4b: Apakah Anda merasa menerima pengobatan yang tepat untuk masalah fisik Anda saat ini?',
    options: [
      { label: 'Saya tidak mempunyai masalah fisik saat ini', value: 0 },
      { label: 'Saya menerima perawatan yang sesuai', value: 1 },
      { label: 'Saya ragu mengenai kelayakan pengobatan saat ini', value: 2 },
      { label: 'Saya mempunyai banyak keraguan tentang kelayakan pengobatan', value: 3 },
      { label: 'Pengobatan yang tepat masih belum ditemukan', value: 3 },
    ],
    orderIndex: 26,
    required: true,
  },

  // --- Historis: Cara Mengatasi ---
  {
    variableName: 'hist_5_cara_mengatasi',
    type: 'radio',
    prompt: '5: Dalam 5 tahun terakhir, bagaimana Anda mengatasi situasi yang penuh tekanan dan sulit?',
    options: [
      { label: 'Secara umum, saya selalu mampu mengatasi situasi yang penuh tekanan', value: 0 },
      { label: 'Terkadang saya mengalami kesulitan dan ini kadang menimbulkan ketegangan dengan orang lain', value: 1 },
      { label: 'Saya sering mengalami kesulitan yang sering menyebabkan ketegangan dengan orang lain', value: 2 },
      { label: 'Saya selalu mengalami kesulitan dalam situasi penuh tekanan dan mereka membuat saya tegang', value: 3 },
    ],
    orderIndex: 27,
    required: true,
  },

  // --- Historis: Kesehatan Mental ---
  {
    variableName: 'hist_6_kesehatan_mental',
    type: 'radio',
    prompt: '6: Di masa lalu, apakah Anda pernah mengalami masalah psikologis seperti tegang, cemas, sedih, atau bingung?',
    options: [
      { label: 'Tidak, hampir tidak pernah', value: 0 },
      { label: 'Ya, namun tanpa pengaruh yang jelas pada kehidupan sehari-hari', value: 1 },
      { label: 'Ya dan itu mempengaruhi kehidupan sehari-hari saya', value: 2 },
      { label: 'Ya dan masalah ini telah atau masih berdampak jangka panjang pada kehidupan sehari-hari saya', value: 3 },
    ],
    orderIndex: 28,
    required: true,
  },

  // --- Saat ini: Resistensi Pengobatan ---
  {
    variableName: 'saat_ini_7_resistensi_pengobatan',
    type: 'radio',
    prompt: '7: Apakah menurut Anda sulit untuk mengikuti rekomendasi penyedia layanan kesehatan Anda?',
    options: [
      { label: 'Tidak, menurut saya ini tidak sulit', value: 0 },
      { label: 'Ya, sulit, tapi saya bisa mengatasinya', value: 1 },
      { label: 'Ya, sulit, kadang saya bisa, kadang tidak', value: 2 },
      { label: 'Ya, terlalu sulit, sering kali saya tidak berhasil', value: 3 },
    ],
    orderIndex: 29,
    required: true,
  },

  // --- Saat ini: Gejala Kesehatan Mental ---
  {
    variableName: 'saat_ini_8_gejala_mental',
    type: 'radio',
    prompt: '8: Saat ini apakah anda sedang mengalami gangguan psikologis seperti tegang, cemas, down/blue, atau bingung?',
    options: [
      { label: 'Tidak, tidak ada masalah', value: 0 },
      { label: 'Ya, masalah ringan yang tidak mempengaruhi aktivitas sehari-hari', value: 1 },
      { label: 'Ya, masalah sedang yang sedikit mempengaruhi aktivitas sehari-hari', value: 2 },
      { label: 'Ya, masalah parah yang sangat mempengaruhi aktivitas sehari-hari', value: 3 },
    ],
    orderIndex: 30,
    required: true,
  },

  // --- Historis: Pekerjaan dan Waktu Luang ---
  {
    variableName: 'hist_9a_memiliki_pekerjaan',
    type: 'radio',
    prompt: '9a: Apakah saat ini Anda mempunyai pekerjaan tetap?',
    options: [
      { label: 'Ya', value: 1 },
      { label: 'Tidak', value: 0 },
    ],
    orderIndex: 31,
    required: true,
  },
  {
    // Only scored when 9a = Tidak. Value 0 = functioning group; value 1 = non-functioning.
    variableName: 'hist_9b_alasan_tidak_bekerja',
    type: 'radio',
    prompt: '9b: Jika Anda menjawab Tidak pada 9a, sebutkan alasannya (pilih "Tidak berlaku" jika masih bekerja)',
    options: [
      { label: 'Tidak berlaku (saya masih bekerja)', value: 0 },
      { label: 'Saya adalah seorang pelajar/mahasiswa', value: 0 },
      { label: 'Saya sudah pensiun', value: 0 },
      { label: 'Saya mengurus rumah tangga dan lain-lain', value: 0 },
      { label: 'Saya penyandang disabilitas (cacat fisik/mental)', value: 1 },
      { label: 'Saya cuti sakit lebih dari 6 bulan', value: 1 },
    ],
    orderIndex: 32,
    required: true,
  },
  {
    variableName: 'hist_9c_kegiatan_luang',
    type: 'radio',
    prompt: '9c: Apakah Anda mempunyai kegiatan di waktu luang seperti menjadi sukarelawan, mengikuti kursus, olahraga, klub/komunitas?',
    options: [
      { label: 'Ya', value: 1 },
      { label: 'Tidak', value: 0 },
    ],
    orderIndex: 33,
    required: true,
  },

  // --- Historis: Hubungan Sosial ---
  {
    variableName: 'hist_10_hubungan_sosial',
    type: 'radio',
    prompt: '10: Bagaimana biasanya Anda bersosialisasi dengan orang lain?',
    options: [
      { label: 'Saya bersosialisasi dengan orang lain dengan baik', value: 0 },
      { label: 'Saya bersosialisasi dengan orang lain, meskipun kadang-kadang timbul masalah', value: 1 },
      { label: 'Sulit bagi saya untuk memulai atau mempertahankan hubungan atau pertemanan dengan orang lain', value: 2 },
      { label: 'Hubungan atau pertemanan sering kali memburuk menjadi pertengkaran dan konflik', value: 3 },
    ],
    orderIndex: 34,
    required: true,
  },

  // --- Saat ini: Stabilitas Tempat Tinggal ---
  {
    variableName: 'saat_ini_11_stabilitas_tempat_tinggal',
    type: 'radio',
    prompt: '11: Apakah situasi di rumah Anda dirasa nyaman (dalam kondisi baik)? Atau apakah diperlukan berbagai penyesuaian?',
    options: [
      { label: 'Tidak perlu penyesuaian, saya dapat mengatur situasi rumah saya', value: 0 },
      { label: 'Tidak diperlukan penyesuaian, karena dukungan dan perhatian dari orang lain sudah cukup', value: 1 },
      { label: 'Penyesuaian diperlukan, namun tidak segera', value: 2 },
      { label: 'Diperlukan penyesuaian segera', value: 3 },
    ],
    orderIndex: 35,
    required: true,
  },

  // --- Saat ini: Dukungan Sosial ---
  {
    variableName: 'saat_ini_12_dukungan_sosial',
    type: 'radio',
    prompt: '12: Apakah bantuan dari pasangan, keluarga, kolega, atau teman Anda tersedia kapan saja?',
    options: [
      { label: 'Saya tidak membutuhkan bantuan', value: 0 },
      { label: 'Ya, bantuan tersedia setiap saat', value: 0 },
      { label: 'Ya, bantuan tersedia tetapi tidak setiap saat', value: 1 },
      { label: 'Bantuan yang saya dapatkan sangat terbatas', value: 2 },
      { label: 'Tidak ada bantuan yang tersedia', value: 3 },
    ],
    orderIndex: 36,
    required: true,
  },

  // --- Historis: Akses Perawatan ---
  {
    variableName: 'hist_13_akses_perawatan',
    type: 'radio',
    prompt: '13: Apakah Anda mengalami kesulitan dalam mendapatkan layanan kesehatan yang Anda perlukan karena tinggal terlalu jauh, tidak mempunyai asuransi kesehatan (BPJS/KIS/JKN/ASKES/swasta), atau terdapat perbedaan bahasa/budaya?',
    options: [
      { label: 'Tidak, ini bukan masalah bagi saya', value: 0 },
      { label: 'Ya, saya kadang-kadang mengalami beberapa masalah ini', value: 1 },
      { label: 'Ya, sering mengalami beberapa masalah ini', value: 2 },
      { label: 'Ya, beberapa masalah ini merupakan masalah besar bagi saya', value: 3 },
    ],
    orderIndex: 37,
    required: true,
  },

  // --- Historis: Pengalaman Pengobatan ---
  {
    variableName: 'hist_14_pengalaman_pengobatan',
    type: 'radio',
    prompt: '14: Bagaimana pengalaman Anda berhubungan dengan Dokter dan Tenaga kesehatan dalam 5 tahun terakhir?',
    options: [
      { label: 'Saya tidak pernah mempunyai masalah dengan dokter dan tenaga kesehatan', value: 0 },
      { label: 'Saya atau seseorang yang dekat dengan saya mempunyai pengalaman negatif dengan dokter dan tenaga kesehatan', value: 1 },
      { label: 'Saya telah berganti dokter dan tenaga kesehatan karena pengalaman negatif', value: 2 },
      { label: 'Saya sering berganti dokter dan tenaga kesehatan karena pengalaman negatif atau kurangnya kepercayaan', value: 3 },
    ],
    orderIndex: 38,
    required: true,
  },

  // --- Saat ini: Pengaturan Layanan (Q15) ---
  // Multi-select; option values are letter codes used by the scoring engine.
  // Score rule: a/b/f/g/k=0 | c/d/e=1 | (c|d)&e=2 | h/i/j=3
  {
    variableName: 'saat_ini_15_pengaturan_layanan',
    type: 'checkbox',
    prompt: '15: Siapa saja tenaga medis/kesehatan yang merawat Anda saat ini? (Jawaban boleh lebih dari 1)',
    options: [
      { label: 'Saya tidak menerima perawatan apa pun', value: 'a' },
      { label: 'Dokter umum', value: 'b' },
      { label: 'Dokter Spesialis Kedokteran Keluarga Layanan Primer (Sp.KKLP)', value: 'c' },
      { label: 'Satu dokter spesialis di RS (seperti: spesialis paru, spesialis jantung, spesialis bedah, dll)', value: 'd' },
      { label: 'Lebih dari satu dokter spesialis di RS', value: 'e' },
      { label: 'Dokter spesialis masalah kejiwaan (psikiater, psikolog, spesialis penyalahgunaan zat)', value: 'f' },
      { label: 'Pekerja sosial (kader, petugas dinas sosial)', value: 'g' },
      { label: 'Perawat rumah', value: 'h' },
      { label: 'Saat ini saya dirawat di rumah sakit', value: 'i' },
      { label: 'Saat ini saya dirawat di rumah sakit jiwa', value: 'j' },
      { label: 'Lainnya (sebutkan)', value: 'k', requiresText: true },
    ],
    orderIndex: 39,
    required: true,
  },
  // Companion: Q15 Lainnya → never shown as standalone step
  // variableName strips to 'saat_ini_15_pengaturan_layanan' when '_lainnya' suffix removed
  {
    variableName: 'saat_ini_15_pengaturan_layanan_lainnya',
    type: 'text',
    prompt: 'Layanan kesehatan lainnya (sebutkan)',
    orderIndex: 40,
    required: false,
  },

  // --- Saat ini: Koordinasi Perawatan ---
  {
    variableName: 'saat_ini_16_koordinasi_perawatan',
    type: 'radio',
    prompt: '16: Sejauh mana dokter dan tenaga kesehatan (perawat/bidan/petugas laboratorium/petugas radiologi/fisioterapi) yang melayani Anda bisa bekerja sama?',
    options: [
      { label: 'Saya tidak menerima perawatan atau perawatan saya hanya diberikan oleh satu dokter', value: 0 },
      { label: 'Dokter dan tenaga kesehatan saya bekerja sama dengan baik', value: 0 },
      { label: 'Bekerja sama, namun terkadang dibutuhkan lebih banyak komunikasi', value: 1 },
      { label: 'Tidak bekerja sama dengan baik, sehingga kadang-kadang menimbulkan masalah', value: 2 },
      { label: 'Dokter dan tenaga kesehatan saya tidak bekerja sama', value: 3 },
    ],
    orderIndex: 41,
    required: true,
  },

  // --- Prognosis: Komplikasi dan Ancaman ---
  {
    variableName: 'prog_17_perkiraan_fisik',
    type: 'radio',
    prompt: '17: Bagaimana Anda memperkirakan perubahan kesehatan fisik Anda dalam 6 bulan ke depan?',
    options: [
      { label: 'Dalam 6 bulan ke depan saya memperkirakan kesehatan fisik saya tetap sama atau membaik', value: 0 },
      { label: 'Dalam 6 bulan ke depan, saya memperkirakan kesehatan fisik saya hanya akan sedikit memburuk', value: 1 },
      { label: 'Dalam 6 bulan ke depan saya memperkirakan kesehatan fisik saya akan memburuk', value: 2 },
      { label: 'Dalam 6 bulan ke depan, saya memperkirakan kesehatan fisik saya akan sangat memburuk', value: 3 },
    ],
    orderIndex: 42,
    required: true,
  },

  // --- Prognosis: Ancaman Kesehatan Mental ---
  {
    variableName: 'prog_18_perkiraan_mental',
    type: 'radio',
    prompt: '18: Bagaimana Anda memperkirakan perubahan kesehatan mental Anda dalam 6 bulan ke depan?',
    options: [
      { label: 'Dalam 6 bulan ke depan saya berharap kesehatan mental saya tetap sama atau menjadi lebih baik', value: 0 },
      { label: 'Dalam 6 bulan ke depan, saya memperkirakan kesehatan mental saya akan sedikit memburuk', value: 1 },
      { label: 'Dalam 6 bulan ke depan, saya memperkirakan kesehatan mental saya akan memburuk', value: 2 },
      { label: 'Dalam 6 bulan ke depan, saya memperkirakan kesehatan mental saya akan sangat memburuk', value: 3 },
    ],
    orderIndex: 43,
    required: true,
  },

  // --- Prognosis: Kerentanan Sosial ---
  {
    variableName: 'prog_19_perkiraan_sosial',
    type: 'radio',
    prompt: '19: Bagaimana Anda memerlukan perubahan kondisi kehidupan Anda dalam 6 bulan ke depan?',
    options: [
      { label: 'Dalam 6 bulan ke depan tidak perlu mengubah kondisi kehidupan saya saat ini', value: 0 },
      { label: 'Dalam 6 bulan ke depan saya bisa menetap dalam kondisi kehidupan saya saat ini, namun perawatan di rumah diperlukan', value: 1 },
      { label: 'Dalam 6 bulan ke depan diperlukan perubahan kondisi kehidupan', value: 2 },
      { label: 'Perubahan terhadap kondisi kehidupan diperlukan segera', value: 3 },
    ],
    orderIndex: 44,
    required: true,
  },

  // --- Prognosis: Hambatan Sistem Kesehatan ---
  {
    variableName: 'prog_20_kebutuhan_perawatan',
    type: 'radio',
    prompt: '20: Dalam 6 bulan ke depan, apakah Anda memerlukan bantuan dan dukungan lebih?',
    options: [
      { label: 'Saya perkirakan dalam 6 bulan ke depan, kebutuhan layanan kesehatan saya akan tetap sama atau berkurang', value: 0 },
      { label: 'Saya perkirakan dalam 6 bulan ke depan, kebutuhan perawatan saya akan meningkat', value: 1 },
      { label: 'Saya perkirakan dalam 6 bulan ke depan, kebutuhan perawatan saya akan meningkat sangat banyak', value: 2 },
      { label: 'Saya perkirakan dalam 6 bulan ke depan, kebutuhan perawatan saya akan meningkat sangat banyak dan membutuhkan layanan tambahan', value: 3 },
    ],
    orderIndex: 45,
    required: true,
  },
];
