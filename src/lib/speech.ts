/** Picks the best installed voice for a BCP 47 locale, e.g. en-US → en-US, then any en-*. */
function voiceFor(lang: string) {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.split("-")[0];
  return voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.replace("_", "-").startsWith(base));
}

export function canSpeak(lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  // iOS loads voices lazily: an empty list means "unknown yet", not "unsupported".
  const voices = window.speechSynthesis.getVoices();
  return voices.length === 0 || !!voiceFor(lang);
}

/** Resolves when speech ends; rejects if the device cannot speak this language. */
export function speak(text: string, lang: string, rate = 1) {
  return new Promise<void>((resolve, reject) => {
    if (!("speechSynthesis" in window)) return reject(new Error("unsupported"));
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const voice = voiceFor(lang);
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = (e) => (e.error === "interrupted" || e.error === "canceled" ? resolve() : reject(new Error(e.error)));
    synth.speak(u);
  });
}
