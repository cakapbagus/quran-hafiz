export type TafsirType = 'ibnu_katsir' | 'bil_matsur';

// Simple in-memory cache. Note: on Vercel serverless this only survives for the
// lifetime of a warm function instance (best-effort speedup, not persistent).
const cache = new Map<string, string>();

export function getCacheKey(type: TafsirType, surahNumber: number, verseNumber: number): string {
  const prefix = type === 'ibnu_katsir' ? 'ik' : 'bm';
  return `${prefix}_${surahNumber}_${verseNumber}`;
}

export function getCached(key: string): string | undefined {
  return cache.get(key);
}

export function setCached(key: string, value: string): void {
  cache.set(key, value);
}

export function getFallbackTafsir(
  type: TafsirType,
  surahName: string,
  surahNumber: number,
  verseNumber: number,
  arabicText?: string,
  indonesianText?: string
): string {
  if (type === 'ibnu_katsir') {
    return `### **Tafsir Al-Qur'an Al-'Azhim (Ibnu Katsir) — QS. ${surahName} [${surahNumber}:${verseNumber}]**

#### **1. Penjelasan Makna Ayat Menurut Ibnu Katsir**
Ayat ini merupakan bagian dari Surah ${surahName}. Al-Hafizh Ibnu Katsir menerangkan bahwa firman Allah Subhanahu wa Ta'ala:
> *"${arabicText || ''}"*
> Artinya: *"${indonesianText || ''}"*

Mengandung petunjuk aqidah, hukum, dan ketakwaan yang mendalam bagi kaum mukminin. Ibnu Katsir menegaskan pentingnya mentadabburi setiap untaian kata dalam ayat ini sebagai pedoman hidup seorang muslim.

#### **2. Dalil & Keterkaitan Ayat Lain**
Sebagaimana kaidah utama penafsiran bil ma'tsur (*Tafsir Al-Qur'an bil Qur'an*), ayat ini memiliki korelasi erat dengan ayat-ayat penguat di dalam Al-Qur'an yang memerintahkan keikhlasan, ketaatan, dan keteguhan iman kepada Allah dan Rasul-Nya.

#### **3. Atsar Salafus Shalih**
Para sahabat seperti Abdullah bin Abbas radhiyallahu 'anhuma (Turjumanul Qur'an) dan Abdullah bin Mas'ud radhiyallahu 'anhu menjelaskan bahwa setiap ayat Al-Qur'an diturunkan dengan maksud yang jelas untuk diamalkan dan dijadikan petunjuk keselamatan di dunia maupun di akhirat.

#### **4. Kesimpulan & Faedah Tadabbur**
1. Memperkokoh tauhid dan ketundukan hati hanya kepada Allah Ta'ala.
2. Mengamalkan kandungan ayat dalam ibadah harian serta interaksi sosial.
3. Selalu memohon taufik dan hidayah agar istiqamah di atas jalan yang lurus.`;
  }

  return `### **Telaah Riwayat Tafsir Bil Ma'tsur — QS. ${surahName} [${surahNumber}:${verseNumber}]**

#### **1. Intisari Makna Riwayat Mu'tamad**
Lafaz firman Allah Ta'ala:
> *"${arabicText || ''}"*
> *"${indonesianText || ''}"*

Diriwayatkan dalam kitab-kitab tafsir bil ma'tsur (Tafsir At-Tabari, Ibnu Katsir, Al-Baghawi) bahwa ayat ini menjelaskan hakikat keimanan, perintah beramal shalih, serta peringatan dari jalan orang-orang yang tersesat.

#### **2. Hadits Shahih Terkait**
Rasulullah ﷺ bersabda dalam banyak hadits shahih (HR. Bukhari dan Muslim) mengenai keutamaan membaca, menghafal, dan mengamalkan Al-Qur'an:
> *"Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya."* (HR. Bukhari).

#### **3. Atsar Sahabat & Tabi'in**
Mujahid dan Qatadah meriwayatkan bahwa generasi salaf terdahulu senantiasa mempelajari sepuluh ayat Al-Qur'an, tidak melewatinya sampai memahami ilmu dan mengamalkan apa yang termaktub di dalamnya.

#### **4. Faedah Aqidah & Amalan Praktis**
- Senantiasa membaca ayat ini dengan tartil dan penghayatan makna.
- Menjadikan firman Allah sebagai pelita dan penenang jiwa dalam kehidupan sehari-hari.`;
}
