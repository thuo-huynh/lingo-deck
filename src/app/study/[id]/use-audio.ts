"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canSpeak, speak } from "@/lib/speech";

/** Plays the uploaded file when there is one, otherwise the device voice. Reports failure instead of faking success. */
export function useAudio(card: { audioUrl?: string; speech?: string; languageCode: string }, autoplay: boolean) {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const available = !!card.audioUrl || (!!card.speech && canSpeak(card.languageCode));

  const play = useCallback(
    async (slow = false) => {
      setPlaying(true);
      try {
        if (card.audioUrl) {
          audio.current ??= new Audio(card.audioUrl);
          audio.current.currentTime = 0;
          audio.current.playbackRate = slow ? 0.7 : 1;
          await audio.current.play();
          await new Promise((r) => audio.current!.addEventListener("ended", r, { once: true }));
        } else if (card.speech) {
          await speak(card.speech, card.languageCode, slow ? 0.6 : 1);
        } else {
          throw new Error("no audio");
        }
        setFailed(false);
      } catch (e) {
        // Autoplay blocked is not a failure: the learner can still tap play (spec 4.2.C.2).
        if (!(e instanceof DOMException && e.name === "NotAllowedError")) setFailed(true);
      } finally {
        setPlaying(false);
      }
    },
    [card.audioUrl, card.speech, card.languageCode]
  );

  useEffect(() => {
    const t = autoplay && available ? setTimeout(() => play(), 0) : undefined;
    return () => {
      clearTimeout(t);
      audio.current?.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- play once per card
  }, []);

  return { play, playing, failed: failed || !available };
}
