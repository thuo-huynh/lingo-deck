/** Study languages offered when creating a deck; any other BCP 47 code can be typed in (#3). */
export const LANGUAGES = {
  en: { label: "Tiếng Anh", native: "English", code: "en-US" },
  ja: { label: "Tiếng Nhật", native: "日本語", code: "ja-JP" },
  ko: { label: "Tiếng Hàn", native: "한국어", code: "ko-KR" },
  zh: { label: "Tiếng Trung", native: "中文", code: "zh-CN" },
  fr: { label: "Tiếng Pháp", native: "Français", code: "fr-FR" },
  de: { label: "Tiếng Đức", native: "Deutsch", code: "de-DE" },
  es: { label: "Tiếng Tây Ban Nha", native: "Español", code: "es-ES" },
  it: { label: "Tiếng Ý", native: "Italiano", code: "it-IT" },
  pt: { label: "Tiếng Bồ Đào Nha", native: "Português", code: "pt-BR" },
  ru: { label: "Tiếng Nga", native: "Русский", code: "ru-RU" },
  th: { label: "Tiếng Thái", native: "ไทย", code: "th-TH" },
  id: { label: "Tiếng Indonesia", native: "Bahasa Indonesia", code: "id-ID" },
} as const;

export const LANGUAGE_CODE = /^[a-z]{2,3}(-[A-Z]{2})?$/;

/** "tiếng Nhật" for ja-JP; null for a code not in the list. */
export function languageName(code: string) {
  const l = Object.values(LANGUAGES).find((x) => x.code.split("-")[0] === code.split("-")[0]);
  return l ? l.label.replace("Tiếng", "tiếng") : null;
}
