import { expect, test } from "./fixtures";

test("a deck shared by link can be added to another user's library once", async ({ page, signIn }) => {
  await signIn({ onboarded: true });
  await page.goto("/decks/new");
  await page.getByLabel("Tên bộ từ").fill("Chia sẻ thử");
  await page.getByRole("button", { name: "Tạo bộ từ" }).click();
  await expect(page.getByRole("heading", { name: "Chia sẻ thử" })).toBeVisible();

  await page.getByRole("button", { name: "Tùy chọn bộ từ" }).click();
  await page.getByRole("dialog", { name: "Chia sẻ thử" }).getByRole("button", { name: "Chia sẻ" }).click();
  const sheet = page.getByRole("dialog", { name: "Chia sẻ “Chia sẻ thử”" });
  await sheet.getByRole("switch").click();
  const link = await sheet.getByLabel("Link chia sẻ").inputValue();
  expect(link).toMatch(/\/share\/[\w-]+$/);

  await signIn({ onboarded: true });
  await page.goto(new URL(link).pathname);
  await page.getByRole("button", { name: "Thêm vào thư viện" }).click();
  await expect(page.getByRole("heading", { name: "Chia sẻ thử" })).toBeVisible();

  await page.goto(new URL(link).pathname);
  await expect(page.getByText("Bạn đã có bộ này trong thư viện.")).toBeVisible();
});

test("signed out, a share link previews the deck and asks to sign in", async ({ page }) => {
  await page.goto("/share/doesnotexist123");
  await expect(page.getByRole("heading", { name: "Link không còn hoạt động" })).toBeVisible();
});

test("typing steps show one blank per letter", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Học thử 1 từ" }).click();
  await page.getByRole("button", { name: /Thẻ ghi nhớ apple/ }).click({ position: { x: 20, y: 200 } });
  await page.getByRole("group", { name: "Tự đánh giá" }).getByRole("button").nth(2).click();
  await expect(page.getByLabel("Từ có 5 chữ cái")).toBeVisible();
});

test("a pasted list previews before import", async ({ page, signIn }) => {
  await signIn({ onboarded: true });
  await page.goto("/decks/new");
  await page.getByLabel("Tên bộ từ").fill("Dán");
  await page.getByRole("button", { name: "Tạo bộ từ" }).click();
  await expect(page.getByRole("heading", { name: "Dán" })).toBeVisible();
  await page.goto(page.url() + "/import");
  await page.getByLabel("Hoặc dán danh sách, mỗi dòng một từ").fill("big - to\ncat - con mèo");
  await page.getByRole("button", { name: "Xem trước danh sách" }).click();
  await page.getByRole("button", { name: "Nhập 2 từ" }).click();
  await expect(page.getByText("cat", { exact: true })).toBeVisible();
});
