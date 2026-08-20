import React from 'react';

export type TajwidRuleKey =
  | 'ghunnah'
  | 'idgham_bighunnah'
  | 'idgham_bilaghunnah'
  | 'iqlab'
  | 'ikhfa_haqiqi'
  | 'ikhfa_syafawi'
  | 'idgham_mimi'
  | 'izhar_halqi'
  | 'izhar_syafawi'
  | 'qalqalah'
  | 'mad_wajib'
  | 'mad_jaiz'
  | 'mad_lazim'
  | 'mad_arid'
  | 'mad_iwad'
  | 'mad_thobii'
  | 'waqaf_lazim'
  | 'waqaf_jaiz'
  | 'waqaf_aula'
  | 'washal_aula'
  | 'waqaf_mamnu'
  | 'waqaf_muanaqah'
  | 'saktah'
  | 'ibtida_tam'
  | 'ibtida_kafi'
  | 'ibtida_hasan'
  | 'ibtida_qabih'
  | 'hamzah_washl';

export interface TajwidRuleInfo {
  key: TajwidRuleKey;
  name: string;
  category: 'Nun Sukun & Tanwin' | 'Mim Sukun' | 'Qalqalah' | 'Hukum Mad' | 'Ghunnah' | 'Tanda Waqaf' | 'Kaidah Ibtida\'';
  color: string; // Hex / Tailwind color
  bgColor: string;
  textColor: string;
  borderColor: string;
  shortDesc: string;
  caraBaca: string;
  contohLafaz: string;
  huruf: string[];
}

export const TAJWID_RULES: TajwidRuleInfo[] = [
  // 1. Ghunnah Musyaddadah
  {
    key: 'ghunnah',
    name: 'Ghunnah Musyaddadah',
    category: 'Ghunnah',
    color: '#EC4899', // Pink
    bgColor: 'bg-pink-500/15',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    shortDesc: 'Dengung sempurna ketika huruf Nun (نّ) atau Mim (مّ) bertasydid.',
    caraBaca: 'Didengungkan dengan menahan suara di pangkal hidung selama 2 harakat (ketukan).',
    contohLafaz: 'إِنَّ اللَّهَ ، ثُمَّ كَلَّا',
    huruf: ['نّ', 'مّ']
  },
  // 2. Iqlab
  {
    key: 'iqlab',
    name: 'Iqlab',
    category: 'Nun Sukun & Tanwin',
    color: '#3B82F6', // Blue
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    shortDesc: 'Nun sukun atau tanwin bertemu huruf Ba (ب). Disertai tanda mim kecil (ۘ / ۢ).',
    caraBaca: 'Mengubah bunyi suara nun sukun/tanwin menjadi bunyi mim disertai dengung (ghunnah 2 harakat).',
    contohLafaz: 'مِنْ بَعْدِ ، عَلِيمٌ بِذَاتِ',
    huruf: ['ب']
  },
  // 3. Idgham Bighunnah
  {
    key: 'idgham_bighunnah',
    name: 'Idgham Bi Ghunnah',
    category: 'Nun Sukun & Tanwin',
    color: '#10B981', // Emerald Green
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    shortDesc: 'Nun sukun atau tanwin bertemu salah satu huruf: Ya (ي), Nun (ن), Mim (م), Waw (و).',
    caraBaca: 'Memasukkan bunyi nun sukun/tanwin ke huruf berikutnya disertai dengung 2 harakat.',
    contohLafaz: 'مَنْ يَقُولُ ، مِّن مَّالٍ',
    huruf: ['ي', 'ن', 'م', 'و']
  },
  // 4. Idgham Bilaghunnah
  {
    key: 'idgham_bilaghunnah',
    name: 'Idgham Bila Ghunnah',
    category: 'Nun Sukun & Tanwin',
    color: '#6366F1', // Indigo
    bgColor: 'bg-indigo-500/15',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    shortDesc: 'Nun sukun atau tanwin bertemu huruf Lam (ل) atau Ra (ر).',
    caraBaca: 'Memasukkan bunyi nun sukun/tanwin ke huruf lam/ra secara lebur utuh tanpa dengung.',
    contohLafaz: 'مِنْ رَبِّهِمْ ، غَفُورٌ رَحِيمٌ',
    huruf: ['ل', 'ر']
  },
  // 5. Ikhfa Haqiqi
  {
    key: 'ikhfa_haqiqi',
    name: 'Ikhfa Haqiqi',
    category: 'Nun Sukun & Tanwin',
    color: '#F59E0B', // Amber / Orange
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    shortDesc: 'Nun sukun atau tanwin bertemu 15 huruf ikhfa.',
    caraBaca: 'Menyamarkan bunyi nun sukun/tanwin antara izhar dan idgham disertai dengung 2 harakat menuju makhraj huruf berikutnya.',
    contohLafaz: 'مِنْ كُلِّ ، أَنْزَلْنَا ، كِتَابٌ كَرِيمٌ',
    huruf: ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك']
  },
  // 6. Izhar Halqi
  {
    key: 'izhar_halqi',
    name: 'Izhar Halqi',
    category: 'Nun Sukun & Tanwin',
    color: '#14B8A6', // Teal
    bgColor: 'bg-teal-500/15',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/30',
    shortDesc: 'Nun sukun atau tanwin bertemu 6 huruf tenggorokan (Halq).',
    caraBaca: 'Membaca nun sukun/tanwin secara jelas, tegas, tanpa dengung yang berlebih.',
    contohLafaz: 'مَنْ آمَنَ ، مِنْ حَكِيمٍ ، أَنْعَمْتَ',
    huruf: ['ء', 'هـ', 'ع', 'ح', 'غ', 'خ']
  },
  // 7. Qalqalah (Kubra & Sughra)
  {
    key: 'qalqalah',
    name: 'Qalqalah (Sughra / Kubra)',
    category: 'Qalqalah',
    color: '#06B6D4', // Cyan
    bgColor: 'bg-cyan-500/15',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    shortDesc: 'Memantulkan huruf qalqalah yang berharakat sukun (asli atau waqaf): Qaf, Tho, Ba, Jim, Dal (ق، ط، ب، ج، د).',
    caraBaca: 'Membaca dengan pantulan suara yang jelas. Sughra di tengah kata pantulannya ringan, Kubra di akhir kata/waqaf pantulannya kuat.',
    contohLafaz: 'يَجْعَلُونَ ، الْفَلَقِ ، كَسَبَ ، أَحَدٌ',
    huruf: ['ق', 'ط', 'ب', 'ج', 'د']
  },
  // 8. Ikhfa Syafawi
  {
    key: 'ikhfa_syafawi',
    name: 'Ikhfa Syafawi',
    category: 'Mim Sukun',
    color: '#8B5CF6', // Purple
    bgColor: 'bg-purple-500/15',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    shortDesc: 'Mim sukun (مْ) bertemu huruf Ba (ب).',
    caraBaca: 'Menyamarkan bunyi mim pada bibir disertai dengung 2 harakat.',
    contohLafaz: 'تَرْمِيهِمْ بِحِجَارَةٍ ، هُمْ بِهِ',
    huruf: ['ب (setelah Mim Sukun)']
  },
  // 9. Idgham Mimi / Mutamatsilain
  {
    key: 'idgham_mimi',
    name: 'Idgham Mimi (Mutamatsilain)',
    category: 'Mim Sukun',
    color: '#A855F7', // Violet
    bgColor: 'bg-violet-500/15',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    shortDesc: 'Mim sukun (مْ) bertemu huruf Mim (م).',
    caraBaca: 'Memasukkan mim pertama ke mim kedua dengan tasydid dan dengung 2 harakat.',
    contohLafaz: 'لَهُمْ مَّا يَشَاءُونَ ، كُنتُم مُّؤْمِنِينَ',
    huruf: ['م (setelah Mim Sukun)']
  },
  // 10. Izhar Syafawi
  {
    key: 'izhar_syafawi',
    name: 'Izhar Syafawi',
    category: 'Mim Sukun',
    color: '#64748B', // Slate / Gray
    bgColor: 'bg-slate-500/15',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-500/30',
    shortDesc: 'Mim sukun (مْ) bertemu seluruh huruf hijaiyah kecuali Mim dan Ba.',
    caraBaca: 'Membaca mim sukun secara jelas di bibir tanpa dengung, terutama saat bertemu Waw (و) atau Fa (ف).',
    contohLafaz: 'أَلَمْ تَرَ ، لَعَلَّكُمْ تَتَّقُونَ',
    huruf: ['Semua huruf kecuali Mim dan Ba']
  },
  // 11. Mad Wajib Muttashil
  {
    key: 'mad_wajib',
    name: 'Mad Wajib Muttashil',
    category: 'Hukum Mad',
    color: '#EF4444', // Red
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    shortDesc: 'Mad thabi\'i bertemu huruf Hamzah (ء) dalam satu kata bersambung (tanda bendera ~).',
    caraBaca: 'Dibaca panjang 4 sampai 5 harakat (atau 6 harakat saat waqaf). Wajib dipanjangkan.',
    contohLafaz: 'جَآءَ ، السَّمَآءِ ، سُوۤءَ',
    huruf: ['~ (Mad bertemu Hamzah 1 kata)']
  },
  // 12. Mad Jaiz Munfashil
  {
    key: 'mad_jaiz',
    name: 'Mad Jaiz Munfashil',
    category: 'Hukum Mad',
    color: '#FB923C', // Orange light
    bgColor: 'bg-orange-500/15',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    shortDesc: 'Mad thabi\'i di akhir kata bertemu huruf Hamzah di awal kata berikutnya (terpisah).',
    caraBaca: 'Boleh dibaca panjang 2, 4, atau 5 harakat (menurut jalur Syathibiyyah diutamakan 4-5 harakat).',
    contohLafaz: 'إِنَّآ أَعْطَيْنَاكَ ، يَا أَيُّهَا',
    huruf: ['~ (Mad bertemu Hamzah beda kata)']
  },
  // 13. Mad Lazim
  {
    key: 'mad_lazim',
    name: 'Mad Lazim (Kilmi / Harfi)',
    category: 'Hukum Mad',
    color: '#DC2626', // Deep Red
    bgColor: 'bg-red-600/15',
    textColor: 'text-red-500',
    borderColor: 'border-red-600/30',
    shortDesc: 'Mad thabi\'i bertemu huruf bertasydid atau sukun lazim asli (seperti Alif Lam Mim, Adh-Dhaallin).',
    caraBaca: 'Pasti/lazim dipanjangkan 6 harakat (3 alif) tanpa boleh dikurangi.',
    contohLafaz: 'الضَّآلِّينَ ، الۤمّۤ ، حٰمۤ',
    huruf: ['Mad + Tasydid / Huruf Muqaththa\'ah']
  },
  // 14. Mad 'Aridh Lissukun
  {
    key: 'mad_arid',
    name: 'Mad \'Aridh Lissukun',
    category: 'Hukum Mad',
    color: '#D97706', // Amber dark
    bgColor: 'bg-amber-600/15',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-600/30',
    shortDesc: 'Mad thabi\'i yang bertemu huruf hidup di akhir ayat atau sebelum waqaf yang disukunkan.',
    caraBaca: 'Boleh dibaca 2, 4, atau 6 harakat (3 pilihan panjang bacaan).',
    contohLafaz: 'الْعَالَمِينَ ۝ ، الرَّحِيمِ ۝ ، تَعْلَمُونَ ۝',
    huruf: ['Mad di akhir waqaf']
  },
  // 15. Waqaf Lazim (مـ)
  {
    key: 'waqaf_lazim',
    name: 'Waqaf Lazim (مـ)',
    category: 'Tanda Waqaf',
    color: '#E11D48', // Rose / Red
    bgColor: 'bg-rose-500/15',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    shortDesc: 'Tanda Waqaf Lazim (مـ) mewajibkan berhenti untuk menjaga kesempurnaan makna ayat agar tidak rancu dengan kalimat setelahnya.',
    caraBaca: 'Wajib berhenti mengambil napas, kemudian melanjutkan bacaan dari kalimat berikutnya.',
    contohLafaz: 'إِنَّمَا يَسْتَجِيبُ الَّذِينَ يَسْمَعُونَ ۘ وَالْمَوْتَىٰ يَبْعَثُهُمُ اللَّهُ',
    huruf: ['مـ (Tanda Waqaf Lazim)']
  },
  // 16. Waqaf Jaiz (ج)
  {
    key: 'waqaf_jaiz',
    name: 'Waqaf Jaiz (ج)',
    category: 'Tanda Waqaf',
    color: '#10B981', // Emerald
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    shortDesc: 'Tanda Waqaf Jaiz (ج) membolehkan pembaca untuk berhenti atau meneruskan bacaan (keduanya sama-sama baik).',
    caraBaca: 'Boleh berhenti mengambil napas atau boleh disambung terus tanpa berhenti.',
    contohLafaz: 'نَحْنُ نَقُصُّ عَلَيْكَ نَبَأَهُم بِالْحَقِّ ۚ إِنَّهُمْ فِتْيَةٌ',
    huruf: ['ج (Tanda Waqaf Jaiz)']
  },
  // 17. Al-Waqfu Aula (قلى)
  {
    key: 'waqaf_aula',
    name: 'Al-Waqfu Aula (قلى)',
    category: 'Tanda Waqaf',
    color: '#D4AF37', // Gold
    bgColor: 'bg-[#D4AF37]/15',
    textColor: 'text-[#D4AF37]',
    borderColor: 'border-[#D4AF37]/30',
    shortDesc: 'Tanda Al-Waqfu Aula (قلى) menunjukkan bahwa berhenti (waqaf) lebih utama dan lebih utama daripada meneruskan bacaan.',
    caraBaca: 'Diutamakan berhenti mengambil napas, meskipun washal (terus) tetap diperbolehkan.',
    contohLafaz: 'قُل رَّبِّي أَعْلَمُ بِعِدَّتِهِم مَّا يَعْلَمُهُمْ إِلَّا قَلِيلٌ ۗ',
    huruf: ['قلى (Al-Waqfu Aula)']
  },
  // 18. Al-Washlu Aula (صلى)
  {
    key: 'washal_aula',
    name: 'Al-Washlu Aula (صلى)',
    category: 'Tanda Waqaf',
    color: '#06B6D4', // Cyan
    bgColor: 'bg-cyan-500/15',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    shortDesc: 'Tanda Al-Washlu Aula (صلى) menunjukkan bahwa meneruskan bacaan (washal) lebih utama daripada berhenti.',
    caraBaca: 'Diutamakan menyambung bacaan ke kalimat selanjutnya tanpa berhenti selama napas mencukupi.',
    contohLafaz: 'وَإِن يَمْسَسْكَ اللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُ إِلَّا هُوَ ۖ',
    huruf: ['صلى (Al-Washlu Aula)']
  },
  // 19. Waqaf Mamnu' / Laa Waqfa Fih (لا)
  {
    key: 'waqaf_mamnu',
    name: 'Waqaf Mamnu\' (لا)',
    category: 'Tanda Waqaf',
    color: '#F43F5E', // Rose red
    bgColor: 'bg-rose-600/15',
    textColor: 'text-rose-500',
    borderColor: 'border-rose-600/30',
    shortDesc: 'Tanda tidak boleh berhenti (لا) di tengah kalimat yang maknanya belum tuntas dan saling berkaitan erat.',
    caraBaca: 'Dilarang berhenti di sini; jika terpaksa berhenti karena kehabisan napas, wajib mengulang dari kata sebelumnya.',
    contohLafaz: 'الَّذِينَ تَتَوَفَّاهُمُ الْمَلَائِكَةُ طَيِّبِينَ ۙ يَقُولُونَ سَلَامٌ عَلَيْكُمُ',
    huruf: ['لا (Waqaf Mamnu\')']
  },
  // 20. Waqaf Mu'anaqah / Muraqabah (ۛ ... ۛ)
  {
    key: 'waqaf_muanaqah',
    name: 'Waqaf Mu\'anaqah (ۛ ... ۛ)',
    category: 'Tanda Waqaf',
    color: '#A855F7', // Purple
    bgColor: 'bg-purple-500/15',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    shortDesc: 'Tanda titik tiga berpasangan (ۛ). Pembaca hanya boleh berhenti di salah satu tanda titik tiga, tidak boleh berhenti di keduanya.',
    caraBaca: 'Jika berhenti pada tanda pertama maka terus pada tanda kedua, atau sebaliknya.',
    contohLafaz: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ',
    huruf: ['ۛ ... ۛ (Titik Tiga Berpasangan)']
  },
  // 21. Saktah (س / سكتة)
  {
    key: 'saktah',
    name: 'Saktah (س)',
    category: 'Tanda Waqaf',
    color: '#38BDF8', // Sky Blue
    bgColor: 'bg-sky-500/15',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    shortDesc: 'Berhenti sejenak tanpa bernapas selama kira-kira 2 harakat (1 alif), kemudian melanjutkan bacaan.',
    caraBaca: 'Hentikan suara sejenak tanpa menarik napas baru, lalu lanjutkan kalimat berikutnya dengan fasih.',
    contohLafaz: 'عِوَجًا ۜ قَيِّمًا ، مَرْقَدِنَا ۜ هَذَا ، كَلَّا بَلْ ۜ رَانَ',
    huruf: ['س / ۜ (Saktah 4 Tempat dalam Al-Qur\'an)']
  },
  // 22. Ibtida' Taam (Taraf Sempurna)
  {
    key: 'ibtida_tam',
    name: 'Ibtida\' Taam (Taraf Sempurna)',
    category: 'Kaidah Ibtida\'',
    color: '#10B981', // Emerald
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    shortDesc: 'Memulai bacaan dari lafaz yang maknanya sudah sempurna, tidak memiliki keterkaitan lafaz maupun makna dengan kalimat sebelumnya.',
    caraBaca: 'Sangat dianjurkan; contohnya memulai dari awal surah atau awal tema/kisah baru.',
    contohLafaz: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ، يَا أَيُّهَا الَّذِينَ آمَنُوا',
    huruf: ['Awal Surah / Awal Kisah Mandiri']
  },
  // 23. Ibtida' Kaafi (Taraf Cukup)
  {
    key: 'ibtida_kafi',
    name: 'Ibtida\' Kaafi (Taraf Cukup)',
    category: 'Kaidah Ibtida\'',
    color: '#3B82F6', // Blue
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    shortDesc: 'Memulai bacaan dari kalimat yang maknanya mandiri dan dapat dipahami, meskipun pembahasannya masih berkaitan dengan ayat sebelumnya.',
    caraBaca: 'Boleh dan baik dilakukan setelah waqaf kafi.',
    contohLafaz: 'خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ (setelah ayat إِنَّ الَّذِينَ كَفَرُوا سَوَاءٌ عَلَيْهِمْ)',
    huruf: ['Awal Ayat Mandiri Topik Terkait']
  },
  // 24. Ibtida' Hasan (Taraf Baik)
  {
    key: 'ibtida_hasan',
    name: 'Ibtida\' Hasan (Taraf Baik)',
    category: 'Kaidah Ibtida\'',
    color: '#D4AF37', // Gold
    bgColor: 'bg-[#D4AF37]/15',
    textColor: 'text-[#D4AF37]',
    borderColor: 'border-[#D4AF37]/30',
    shortDesc: 'Memulai bacaan pada lafaz yang maknanya baik dan benar, tetapi secara susunan nahwu/lafaz masih terikat dengan sebelumnya.',
    caraBaca: 'Boleh dilakukan jika berada di awal kepala ayat (ra\'sul ayah).',
    contohLafaz: 'الرَّحْمَٰنِ الرَّحِيمِ (karena merupakan kepala ayat ke-3 Surah Al-Fatihah)',
    huruf: ['Kepala Ayat (Ra\'sul Ayah)']
  },
  // 25. Ibtida' Qabih (Taraf Buruk / Dilarang)
  {
    key: 'ibtida_qabih',
    name: 'Ibtida\' Qabih (Taraf Rusak/Dilarang)',
    category: 'Kaidah Ibtida\'',
    color: '#EF4444', // Red
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    shortDesc: 'Memulai bacaan pada potongan kalimat yang merusak makna atau menimbulkan pengertian yang keliru/kufur.',
    caraBaca: 'Haram/dilarang disengaja; wajib mengulang dari kata yang tepat sebelumnya.',
    contohLafaz: 'إِنَّ اللَّهَ فَقِيرٌ (memotong tanpa membaca لَّقَدْ سَمِعَ اللَّهُ قَوْلَ الَّذِينَ قَالُوا)',
    huruf: ['Potongan Kalimat Merusak Makna']
  },
  // 26. Kaidah Hamzah Washal pada Ibtida'
  {
    key: 'hamzah_washl',
    name: 'Kaidah Hamzah Washal saat Ibtida\'',
    category: 'Kaidah Ibtida\'',
    color: '#8B5CF6', // Purple
    bgColor: 'bg-purple-500/15',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    shortDesc: 'Kaidah penentuan harakat awal (fathah, kasrah, atau dhammah) ketika memulai bacaan dari kata yang diawali Hamzah Washal (ٱ).',
    caraBaca: 'Pada isim ber-Alif Lam dibaca fathah (الْـ -> Al-). Pada fi\'il, lihat huruf ke-3: jika dhammah asli dibaca U (misal: اُدْعُ), jika fathah/kasrah dibaca I (misal: اِقْرَأْ ، اِضْرِبْ).',
    contohLafaz: 'اِقْرَأْ بِاسْمِ رَبِّكَ ، اُدْعُ إِلَىٰ سَبِيلِ رَبِّكَ ، الْحَمْدُ',
    huruf: ['ٱ (Hamzah Washal pada Isim & Fi\'il)']
  }
];

export interface TajwidMatch {
  rule: TajwidRuleKey;
  text: string;
  title: string;
  desc: string;
}

// Color lookup dictionary for high performance
export const TAJWID_COLOR_MAP: Record<TajwidRuleKey, { color: string; label: string; bg: string }> = {
  ghunnah: { color: '#EC4899', label: 'Ghunnah Musyaddadah (نّ / مّ)', bg: 'rgba(236, 72, 153, 0.15)' },
  iqlab: { color: '#3B82F6', label: 'Iqlab (Nun/Tanwin + Ba)', bg: 'rgba(59, 130, 246, 0.15)' },
  idgham_bighunnah: { color: '#10B981', label: 'Idgham Bi Ghunnah (ي ن م و)', bg: 'rgba(16, 185, 129, 0.15)' },
  idgham_bilaghunnah: { color: '#6366F1', label: 'Idgham Bila Ghunnah (ل ر)', bg: 'rgba(99, 102, 241, 0.15)' },
  ikhfa_haqiqi: { color: '#F59E0B', label: 'Ikhfa Haqiqi (15 Huruf Samar)', bg: 'rgba(245, 158, 11, 0.15)' },
  izhar_halqi: { color: '#14B8A6', label: 'Izhar Halqi (ء هـ ع ح غ خ)', bg: 'rgba(20, 184, 166, 0.15)' },
  qalqalah: { color: '#06B6D4', label: 'Qalqalah Pantul (ق ط ب ج د)', bg: 'rgba(6, 182, 212, 0.15)' },
  ikhfa_syafawi: { color: '#8B5CF6', label: 'Ikhfa Syafawi (Mim Sukun + Ba)', bg: 'rgba(139, 92, 246, 0.15)' },
  idgham_mimi: { color: '#A855F7', label: 'Idgham Mimi (Mim Sukun + Mim)', bg: 'rgba(168, 85, 247, 0.15)' },
  izhar_syafawi: { color: '#94A3B8', label: 'Izhar Syafawi', bg: 'rgba(148, 163, 184, 0.15)' },
  mad_wajib: { color: '#EF4444', label: 'Mad Wajib Muttashil (4-5 Harakat)', bg: 'rgba(239, 68, 68, 0.15)' },
  mad_jaiz: { color: '#FB923C', label: 'Mad Jaiz Munfashil (2-5 Harakat)', bg: 'rgba(251, 146, 60, 0.15)' },
  mad_lazim: { color: '#DC2626', label: 'Mad Lazim (6 Harakat)', bg: 'rgba(220, 38, 38, 0.15)' },
  mad_arid: { color: '#D97706', label: 'Mad \'Aridh Lissukun (2-6 Harakat)', bg: 'rgba(217, 119, 6, 0.15)' },
  mad_iwad: { color: '#FBBF24', label: 'Mad \'Iwad', bg: 'rgba(251, 191, 36, 0.15)' },
  mad_thobii: { color: '#38BDF8', label: 'Mad Thabi\'i (2 Harakat)', bg: 'rgba(56, 189, 248, 0.15)' },
  waqaf_lazim: { color: '#E11D48', label: 'Waqaf Lazim (مـ)', bg: 'rgba(225, 29, 72, 0.15)' },
  waqaf_jaiz: { color: '#10B981', label: 'Waqaf Jaiz (ج)', bg: 'rgba(16, 185, 129, 0.15)' },
  waqaf_aula: { color: '#D4AF37', label: 'Al-Waqfu Aula (قلى)', bg: 'rgba(212, 175, 55, 0.15)' },
  washal_aula: { color: '#06B6D4', label: 'Al-Washlu Aula (صلى)', bg: 'rgba(6, 182, 212, 0.15)' },
  waqaf_mamnu: { color: '#F43F5E', label: 'Waqaf Mamnu\' (لا)', bg: 'rgba(244, 63, 94, 0.15)' },
  waqaf_muanaqah: { color: '#A855F7', label: 'Waqaf Mu\'anaqah (ۛ ... ۛ)', bg: 'rgba(168, 85, 247, 0.15)' },
  saktah: { color: '#38BDF8', label: 'Saktah (س)', bg: 'rgba(56, 189, 248, 0.15)' },
  ibtida_tam: { color: '#10B981', label: 'Ibtida\' Taam', bg: 'rgba(16, 185, 129, 0.15)' },
  ibtida_kafi: { color: '#3B82F6', label: 'Ibtida\' Kaafi', bg: 'rgba(59, 130, 246, 0.15)' },
  ibtida_hasan: { color: '#D4AF37', label: 'Ibtida\' Hasan', bg: 'rgba(212, 175, 55, 0.15)' },
  ibtida_qabih: { color: '#EF4444', label: 'Ibtida\' Qabih (Dilarang)', bg: 'rgba(239, 68, 68, 0.15)' },
  hamzah_washl: { color: '#8B5CF6', label: 'Hamzah Washal (ٱ)', bg: 'rgba(139, 92, 246, 0.15)' }
};

/**
 * Tokenizer to split Arabic Uthmani text into color-tagged Tajwid segments.
 * Accurately analyzes diacritics, shaddah, sukun, tanwin, maddah, and surrounding context.
 */
export interface TajwidToken {
  text: string;
  rule?: TajwidRuleKey;
  label?: string;
}

export function parseArabicTajwid(arabicText: string): TajwidToken[] {
  if (!arabicText) return [];

  // Characters definition
  // Sukun: \u0652 (Arabic Sukun), \u06E1 (Arabic Small High Dotless Head of Khah - Uthmani Sukun)
  // Shaddah: \u0651
  // Fathatan: \u064B, Dammatan: \u064C, Kasratan: \u064D
  // Maddah: \u0653, Superscript Alif: \u0670
  // Small High Meem (Iqlab marker): \u06E2, \u06D8

  // We can segment words or sub-tokens using Regex with lookaheads
  const tokens: TajwidToken[] = [];
  
  // Split verse into words while keeping spaces
  const words = arabicText.split(/(\s+)/);

  words.forEach((word) => {
    if (!word || /^\s+$/.test(word)) {
      tokens.push({ text: word });
      return;
    }

    // Process a single Arabic word to colorize specific tajwid letter combinations
    // Patterns list from most specific to general:
    
    // Pattern 1: Mad Wajib / Mad Jaiz / Mad Lazim (Contains Maddah wave ~ \u0653 or \u06E1 / \u0670 + maddah)
    // Pattern 2: Ghunnah Musyaddadah: (نّ / مّ)
    // Pattern 3: Iqlab: contains tanwin / nun sukun followed by Ba or small meem \u06E2
    // Pattern 4: Qalqalah: (ق|ط|ب|ج|د) followed by sukun (\u0652 or \u06E1) or at end of word
    // Pattern 5: Idgham / Ikhfa sequences

    let remaining = word;
    let wordTokens: TajwidToken[] = [];

    // Helper regex to match Tajwid components inside a word:
    // 1. Maddah: letter + \u0653 or \u0670\u0653
    // 2. Ghunnah: (ن|م)[\u064B-\u0650]?\u0651
    // 3. Iqlab: [ۢۘ] or (ن[\u0652\u06E1]?|[\u064B\u064C\u064D])ب
    // 4. Qalqalah: [قطبجد][\u0652\u06E1]

    const combinedRegex = /([^\s\u0653]*?[\u0653][^\s\u0653]*?)|([نNM][\u064B-\u0650]?\u0651[^\s]*?|[مM][\u064B-\u0650]?\u0651[^\s]*?)|([ۢۘ]|ن[\u0652\u06E1]?ب|[\u064B\u064C\u064D]ب)|([قطبجد][\u0652\u06E1])/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(word)) !== null) {
      const matchStart = match.index;
      const matchEnd = combinedRegex.lastIndex;

      // Add leading plain text if any
      if (matchStart > lastIndex) {
        wordTokens.push({ text: word.substring(lastIndex, matchStart) });
      }

      const matchedText = match[0];
      let rule: TajwidRuleKey = 'ghunnah';

      if (match[1]) {
        // Maddah present
        if (matchedText.includes('الضَّ') || matchedText.includes('ۤ') || matchedText.length > 8) {
          rule = 'mad_lazim';
        } else if (matchedText.includes('ء') || matchedText.includes('ئ') || matchedText.includes('ؤ')) {
          rule = 'mad_wajib';
        } else {
          rule = 'mad_jaiz';
        }
      } else if (match[2]) {
        // Ghunnah Musyaddadah
        rule = 'ghunnah';
      } else if (match[3]) {
        // Iqlab
        rule = 'iqlab';
      } else if (match[4]) {
        // Qalqalah
        rule = 'qalqalah';
      }

      wordTokens.push({
        text: matchedText,
        rule,
        label: TAJWID_COLOR_MAP[rule]?.label
      });

      lastIndex = matchEnd;
    }

    if (lastIndex < word.length) {
      wordTokens.push({ text: word.substring(lastIndex) });
    }

    // Append to total tokens
    tokens.push(...wordTokens);
  });

  return tokens;
}
