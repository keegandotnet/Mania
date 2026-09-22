import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const password = "Uat-test-password-42";

async function signUp(page: Page, name: string, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  const signupResponse = page.waitForResponse(
    (response) => response.url().includes("/auth/v1/signup") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Sign up" }).click();
  expect((await signupResponse).ok()).toBe(true);
  await page.waitForFunction(() => {
    const button = Array.from(document.querySelectorAll("button")).find(
      (element) => element.textContent?.trim() === "Sign up"
    );
    return !button || !button.hasAttribute("disabled");
  });
  await page.goto("/play");
  await expect(page).toHaveURL(/\/play/);
}

test("public landing page has no serious automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
});

test("two browser contexts complete a round and keep the selected group", async ({ browser }) => {
  const run = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const hostContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const host = await hostContext.newPage();
  const player = await playerContext.newPage();

  await signUp(host, "Host", `host-${run}@example.com`);
  await host.getByPlaceholder("Group name").fill(`UAT ${run}`);
  await host.getByRole("button", { name: "Create group" }).click();
  await expect(host).toHaveURL(/\/play\?group=/);
  const inviteCode = (await host.locator("span.font-mono").filter({ hasText: /^[A-Z0-9]{6}$/ }).first().textContent())?.trim();
  expect(inviteCode).toMatch(/^[A-Z0-9]{6}$/);

  await signUp(player, "Player", `player-${run}@example.com`);
  await player.getByPlaceholder("ABC123").fill(inviteCode!);
  await player.getByRole("button", { name: "Join group" }).click();
  await expect(player).toHaveURL(/\/play\?group=/);

  await host.reload();
  await expect(host.getByText("2 members")).toBeVisible();
  await host.getByRole("button", { name: "Create game" }).click();
  await host.getByRole("button", { name: "Start round" }).click();
  await host.getByRole("combobox", { name: "Album", exact: true }).fill("Test Album");
  await host.getByLabel("Artist", { exact: true }).fill("Test Artist");
  await host.getByRole("button", { name: "Submit album" }).click();

  await player.reload();
  await expect(player.getByRole("heading", { name: "Leave your review" })).toBeVisible();
  await player.getByLabel("Rating (1-10)").fill("8.5");
  await player.getByLabel("Review (optional)").fill("A complete UAT review.");
  await player.getByRole("button", { name: "Submit review" }).click();
  await expect(player).toHaveURL(/\/results/);
  await expect(player.getByText("Test Album").first()).toBeVisible();

  await hostContext.close();
  await playerContext.close();
});
