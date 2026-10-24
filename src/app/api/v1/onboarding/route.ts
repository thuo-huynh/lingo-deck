import { z } from "zod";
import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { collections } from "@/lib/db";
import { createDeck, listDecks } from "@/features/decks/service";
import { DEFAULT_SETTINGS } from "@/features/decks/settings";
import { createVocab } from "@/features/vocab/service";
import { LANGUAGES, STARTER_EN } from "@/features/onboarding/starter";
import type { StepType } from "@/features/study/attempt";

const input = z.object({
  language: z.enum(Object.keys(LANGUAGES) as [keyof typeof LANGUAGES]),
  newPerDay: z.union([z.literal(5), z.literal(10), z.literal(20)]),
  stepCount: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const ALL_STEPS: StepType[] = ["FLASHCARD", "MEANING_TO_WORD", "AUDIO_TO_WORD"];

export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  const { language, newPerDay, stepCount } = input.parse(await req.json());
  const lang = LANGUAGES[language];
  const { users } = await collections();

  // Re-running onboarding must not create a second starter deck.
  let deckId = (await listDecks(user._id)).find((d) => !d.parentId)?._id.toHexString();
  if (!deckId) {
    const root = await createDeck(user._id, { name: lang.native });
    deckId = root._id.toHexString();
    if (language === "en") {
      const daily = await createDeck(user._id, { name: "Daily Life", parentId: deckId });
      for (const w of STARTER_EN) {
        await createVocab(user._id, {
          deckId: daily._id.toHexString(),
          term: w.term,
          meaningVi: w.meaningVi,
          languageCode: lang.code,
          partOfSpeech: w.partOfSpeech,
          phonetic: w.phonetic,
          examples: [{ text: w.example[0], translationVi: w.example[1] }],
          tags: w.tags,
          acceptedAnswers: w.accepted ?? [],
        });
      }
    }
  }
  const defaultSettings = { ...(user.defaultSettings ?? DEFAULT_SETTINGS), newPerDay, steps: ALL_STEPS.slice(0, stepCount) };
  await users.updateOne({ _id: user._id }, { $set: { onboarded: true, dailyGoal: newPerDay, defaultSettings } });
  return { deckId };
});
