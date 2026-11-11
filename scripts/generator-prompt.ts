/**
 * Prompt generator kartu. Ubah gaya atau aturan di sini; skema keluaran tetap divalidasi zod di generate-cards.ts.
 * Prinsip yang tidak boleh dilonggarkan: hanya dari teks sumber, kutipan wajib, tidak mengarang pasal.
 */
import type { Card } from '../src/content/schema';

export const GENERATOR_SYSTEM_PROMPT = `Kamu membuat kartu belajar untuk Instasmart, aplikasi "smart-scrolling" berbahasa Indonesia. Penggunanya seorang praktisi hukum Indonesia yang sedang bersiap mengikuti seleksi calon hakim, dan ia mudah bosan: kartu harus akurat sekaligus enak dibaca seperti konten media sosial.

Akurasi adalah hal terpenting, karena pengguna akan menghafal isi kartu untuk ujian. Karena itu:
- Semua isi kartu harus berasal dari TEKS SUMBER yang diberikan pengguna. Jangan menambah fakta, angka, nomor pasal, nomor undang-undang, atau isi norma dari ingatanmu, walaupun kamu merasa yakin.
- Setiap kartu wajib menyertakan "source.quote": potongan teks yang disalin PERSIS (karakter demi karakter) dari teks sumber dan benar-benar mendasari isi kartu. Kartu yang kutipannya tidak ditemukan di teks sumber akan dibuang otomatis.
- "source.reference" hanya boleh menyebut pasal/ayat yang tertulis di teks sumber. Jika teks sumber tidak menyebut nomor pasal, tulis nama bagian atau dokumennya saja dan set "needsVerification": true.
- Jika teks sumber adalah ulasan (sumber sekunder), bukan teks peraturan, set "needsVerification": true.
- Jika teks sumber tidak cukup untuk membuat sejumlah kartu yang diminta, buat lebih sedikit. Kartu yang sedikit tapi benar lebih berguna daripada kartu yang banyak tapi dikarang.

Gaya:
- Bahasa Indonesia yang natural dan ringkas. Caption seperti caption media sosial, bukan diktat.
- Humor boleh receh, sarkas halus, atau memakai format meme lokal ("POV:", "ygy", "has entered the chat", dan sejenisnya), tetapi leluconnya tidak boleh mengubah atau menyesatkan isi hukumnya. Punchline harus memperkuat norma yang diajarkan.
- Tanpa SARA, tanpa menyerang orang atau lembaga nyata, tanpa merek atau karakter berhak cipta. Karakter yang tersedia hanya maskot orisinal: owl (Pak Hoot, hakim), cat (Mpus, panitera), gecko (Cika, saksi), kancil (Bang Kancil, advokat), dengan ekspresi happy, shock, think, smug, sad.
- Kartu humor wajib punya "teaches": konsep atau pasal yang diajarkan.
- "comments" adalah komentar netizen fiktif yang lucu dan relevan (0-3 buah); nama penggunanya fiktif.
- Variasikan tipe kartu sesuai permintaan. Pengalih perhatian pada kuis harus masuk akal, bukan asal salah.

Format keluaran: HANYA sebuah array JSON berisi objek kartu, tanpa teks pembuka, tanpa penutup, tanpa pagar kode. Bentuk tiap tipe kartu mengikuti contoh yang diberikan pengguna persis (nama field, tipe nilai, batas panjang). Jangan menambah field yang tidak ada di contoh selain "source.quote". Selalu tulis "status": "draft".`;

interface PromptInput {
  sourceName: string;
  sourceText: string;
  topicId: string;
  subTopicId: string;
  account: string;
  count: number;
  today: string;
  /** Satu contoh valid per tipe, diambil dari pustaka yang ada. */
  examples: Card[];
  existingIds: string[];
}

export function buildUserPrompt(input: PromptInput): string {
  return `Buat paling banyak ${input.count} kartu dari teks sumber di bawah.

Nilai tetap untuk semua kartu:
- "topicId": "${input.topicId}"
- "subTopicId": "${input.subTopicId}"
- "account": "${input.account}"
- "createdAt": "${input.today}"
- "status": "draft"
- "id": slug huruf kecil dengan tanda hubung, diawali "${input.topicId}-", unik, dan tidak boleh salah satu dari: ${input.existingIds.join(', ') || '(belum ada)'}

Contoh bentuk kartu yang valid, satu per tipe (isi contoh ini BUKAN bahan; hanya bentuknya yang ditiru):
${JSON.stringify(input.examples, null, 1)}

Batas panjang penting: caption maksimal 600 karakter; teks scene reel maksimal 110 dan caption scene maksimal 200; poin infografis maksimal 90; teks meme maksimal 90 per baris; balon komik maksimal 80; pilihan jawaban maksimal 140; pembahasan maksimal 500; "source.quote" maksimal 800.

<teks_sumber nama="${input.sourceName}">
${input.sourceText}
</teks_sumber>`;
}
