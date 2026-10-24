import { expect, test } from "./fixtures";

test("signed-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  // Production without a mail key: Google is the only way in.
  await expect(page.getByRole("link", { name: "Tiếp tục với Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gửi mã đăng nhập" })).toHaveCount(0);
});

test("home and privacy pages are public (required by Google's OAuth review)", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "Học từ vựng mỗi ngày, nhớ lâu hơn" })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Chính sách quyền riêng tư" })).toBeVisible();
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Chính sách quyền riêng tư" })).toBeVisible();
});

test("Google sign-in starts an OAuth code flow with PKCE", async ({ request }) => {
  const res = await request.get("/api/v1/auth/google?tz=Asia%2FHo_Chi_Minh", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  const to = new URL(res.headers()["location"]);
  expect(to.host).toBe("accounts.google.com");
  expect(to.searchParams.get("client_id")).toBe("e2e-client.apps.googleusercontent.com");
  expect(to.searchParams.get("redirect_uri")).toBe("http://localhost:3100/api/v1/auth/google/callback");
  expect(to.searchParams.get("code_challenge_method")).toBe("S256");
  expect(res.headers()["set-cookie"]).toContain("ld_oauth=");
});

test("a forged Google callback is rejected back to the login page", async ({ page }) => {
  await page.goto("/api/v1/auth/google/callback?code=fake&state=forged");
  await expect(page).toHaveURL(/\/login\?error=google$/);
  await expect(page.getByText("Không đăng nhập được bằng Google. Thử lại nhé.")).toBeVisible();
});

test("onboarding → learn one word through all three steps → summary", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(page.getByRole("radio", { name: /3 bước/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Học thử 1 từ" }).click();

  // Step 1: flashcard. The starter deck's first word is "apple".
  await expect(page.getByText("Bước 1/3 · Thẻ ghi nhớ")).toBeVisible();
  await expect(page.getByRole("button", { name: /Thẻ ghi nhớ apple/ })).toBeVisible();
  await page.getByRole("button", { name: "Lật thẻ" }).click();
  await expect(page.getByText("quả táo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Nhớ/ }).first().click();

  // Step 2: the Vietnamese meaning is shown, the word is hidden.
  await expect(page.getByText("Bước 2/3 · Viết từ")).toBeVisible();
  await expect(page.getByText("apple", { exact: true })).toHaveCount(0);
  await page.getByLabel("Câu trả lời của bạn").fill("Apple ");
  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(page.getByText("Chính xác!")).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  // Step 3: listening shows no word, no phonetic, no transcript (AC-06).
  await expect(page.getByText("Bước 3/3 · Nghe & viết")).toBeVisible();
  await expect(page.getByText(/apple|æp/)).toHaveCount(0);
  await page.getByLabel("Câu trả lời của bạn").fill("apple");
  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  await expect(page.getByRole("heading", { name: "Xong buổi học" })).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();
});

test("a wrong answer stops the attempt and the word comes back later in the session (AC-03)", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Học thử 1 từ" }).click();

  await page.getByRole("button", { name: "Lật thẻ" }).click();
  await page.getByRole("button", { name: /Rất dễ/ }).click();
  await page.getByLabel("Câu trả lời của bạn").fill("aple");
  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Chưa đúng" })).toBeVisible();
  // The learner's own text stays readable after the check.
  await expect(page.getByLabel("Câu trả lời của bạn")).toHaveValue("aple");
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  await expect(page.getByText("Bước 1/3 · Thẻ ghi nhớ · ôn lại")).toBeVisible();
});

test("leaving mid-session offers to resume from home", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await page.getByRole("button", { name: "Học thử 1 từ" }).click();
  await page.getByRole("button", { name: "Lật thẻ" }).click();
  await page.getByRole("button", { name: /Nhớ/ }).first().click();
  await expect(page.getByText("Bước 2/3 · Viết từ")).toBeVisible();

  await page.getByRole("button", { name: "Thoát buổi học" }).click();
  await page.getByRole("button", { name: "Thoát" }).click();
  await page.getByRole("link", { name: /Tiếp tục buổi học/ }).click();
  await expect(page.getByText("Bước 2/3 · Viết từ")).toBeVisible();
});

test("add a deck and a word from the + button", async ({ page, signIn }) => {
  await signIn({ onboarded: true });
  await page.goto("/decks");
  await page.getByRole("button", { name: "Thêm từ, bộ từ hoặc nhập CSV" }).click();
  await page.getByRole("dialog", { name: "Thêm mới" }).getByRole("link", { name: "Tạo bộ từ" }).click();
  await page.getByLabel("Tên bộ từ").fill("IELTS");
  await page.getByRole("button", { name: "Tạo bộ từ" }).click();
  await expect(page.getByRole("heading", { name: "IELTS" })).toBeVisible();

  await page.getByRole("link", { name: "Thêm từ" }).click();
  await page.getByLabel("Từ", { exact: true }).fill("commute");
  await page.getByLabel("Nghĩa tiếng Việt").fill("đi lại hằng ngày");
  await page.getByRole("button", { name: "Lưu từ" }).click();
  await expect(page.getByText("commute")).toBeVisible();
  await expect(page.getByText(/^1 từ/)).toBeVisible();
});
