import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

/** Onboards a fresh user straight into a one-word, three-step session. */
async function startTrialWord(page: Page) {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Học thử 1 từ" }).click();
  await expect(page.getByText("Bước 1/3 · Thẻ ghi nhớ")).toBeVisible();
}

test("tapping the flashcard flips it to the back and back again", async ({ page, signIn }) => {
  await signIn();
  await startTrialWord(page);
  const card = page.getByRole("button", { name: /Thẻ ghi nhớ apple/ });
  await expect(card).toHaveAttribute("aria-pressed", "false");

  await card.click({ position: { x: 20, y: 200 } });
  await expect(card).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("quả táo", { exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Tự đánh giá" })).toBeVisible();

  await card.click({ position: { x: 20, y: 200 } });
  await expect(card).toHaveAttribute("aria-pressed", "false");
});

test("the audio button plays sound without flipping the card", async ({ page, signIn }) => {
  await signIn();
  await startTrialWord(page);
  await page.getByRole("button", { name: "Nghe phát âm" }).first().click();
  await expect(page.getByRole("button", { name: /Thẻ ghi nhớ apple/ })).toHaveAttribute("aria-pressed", "false");
});

test("the + button opens a bottom sheet with three actions that Esc closes", async ({ page, signIn }) => {
  await signIn({ onboarded: true });
  await page.goto("/decks");
  await page.getByRole("button", { name: "Thêm từ, bộ từ hoặc nhập CSV" }).click();
  const sheet = page.getByRole("dialog", { name: "Thêm mới" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("link")).toHaveText(["Thêm từ", "Tạo bộ từ", "Nhập CSV"]);
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("deleting a deck goes through a confirmation sheet", async ({ page, signIn }) => {
  await signIn({ onboarded: true });
  await page.goto("/decks/new");
  await page.getByLabel("Tên bộ từ").fill("Tạm");
  await page.getByRole("button", { name: "Tạo bộ từ" }).click();
  await expect(page.getByRole("heading", { name: "Tạm" })).toBeVisible();

  await page.getByRole("button", { name: "Tùy chọn bộ từ" }).click();
  await page.getByRole("dialog", { name: "Tạm" }).getByRole("button", { name: "Xoá bộ từ" }).click();
  const confirm = page.getByRole("dialog", { name: "Xoá “Tạm”?" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Xoá", exact: true }).click();
  await expect(page).toHaveURL(/\/decks$/);
  await expect(page.getByText("Tạm", { exact: true })).toHaveCount(0);
});
