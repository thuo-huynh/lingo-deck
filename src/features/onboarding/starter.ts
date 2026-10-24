// Sample deck for the first session (spec 8.1). English only; other languages start with an empty deck.
export const STARTER_EN = [
  { term: "apple", meaningVi: "quả táo", partOfSpeech: "noun", phonetic: "/ˈæp.əl/", example: ["I eat an apple every morning.", "Tôi ăn một quả táo mỗi sáng."], tags: ["food", "A1"] },
  { term: "water", meaningVi: "nước", partOfSpeech: "noun", phonetic: "/ˈwɔː.tər/", example: ["Can I have a glass of water?", "Cho tôi xin một cốc nước được không?"], tags: ["food", "A1"] },
  { term: "breakfast", meaningVi: "bữa sáng", partOfSpeech: "noun", phonetic: "/ˈbrek.fəst/", example: ["We have breakfast at seven.", "Chúng tôi ăn sáng lúc bảy giờ."], tags: ["daily", "A1"] },
  { term: "wake up", meaningVi: "thức dậy", partOfSpeech: "phrasal verb", phonetic: "/weɪk ʌp/", example: ["I wake up early on weekdays.", "Tôi dậy sớm vào các ngày trong tuần."], tags: ["daily", "A1"] },
  { term: "busy", meaningVi: "bận rộn", partOfSpeech: "adjective", phonetic: "/ˈbɪz.i/", example: ["She is busy today.", "Hôm nay cô ấy bận."], tags: ["daily", "A1"] },
  { term: "friend", meaningVi: "bạn bè", partOfSpeech: "noun", phonetic: "/frend/", example: ["He is my best friend.", "Anh ấy là bạn thân nhất của tôi."], tags: ["people", "A1"] },
  { term: "cheap", meaningVi: "rẻ", partOfSpeech: "adjective", phonetic: "/tʃiːp/", example: ["This shirt is cheap.", "Chiếc áo này rẻ."], tags: ["shopping", "A1"] },
  { term: "weather", meaningVi: "thời tiết", partOfSpeech: "noun", phonetic: "/ˈweð.ər/", example: ["The weather is nice today.", "Hôm nay thời tiết đẹp."], tags: ["daily", "A1"] },
  { term: "kitchen", meaningVi: "nhà bếp", partOfSpeech: "noun", phonetic: "/ˈkɪtʃ.ən/", example: ["Mom is cooking in the kitchen.", "Mẹ đang nấu ăn trong bếp."], tags: ["home", "A1"] },
  { term: "tired", meaningVi: "mệt mỏi", partOfSpeech: "adjective", phonetic: "/taɪəd/", example: ["I am tired after work.", "Tôi mệt sau giờ làm."], tags: ["feelings", "A1"] },
  { term: "colour", meaningVi: "màu sắc", partOfSpeech: "noun", phonetic: "/ˈkʌl.ər/", example: ["What colour is your bag?", "Túi của bạn màu gì?"], tags: ["A1"], accepted: ["color"] },
  { term: "slowly", meaningVi: "chậm rãi", partOfSpeech: "adverb", phonetic: "/ˈsləʊ.li/", example: ["Please speak slowly.", "Làm ơn nói chậm thôi."], tags: ["A1"] },
];

export const LANGUAGES = {
  en: { label: "Tiếng Anh", native: "English", code: "en-US" },
  ja: { label: "Tiếng Nhật", native: "日本語", code: "ja-JP" },
  ko: { label: "Tiếng Hàn", native: "한국어", code: "ko-KR" },
  zh: { label: "Tiếng Trung", native: "中文", code: "zh-CN" },
  fr: { label: "Tiếng Pháp", native: "Français", code: "fr-FR" },
} as const;
