import { test, expect } from "@playwright/test";

/**
 * Happy path: browse \u2192 add to cart \u2192 reach checkout page.
 *
 * Full Stripe-test payment is skipped here because it requires:
 *   1. A configured Stripe test account
 *   2. A real STRIPE_WEBHOOK_SECRET piped via `stripe listen`
 *
 * Enable the .skip below once you've configured those in CI.
 */
test("browse \u2192 add to cart \u2192 checkout page", async ({ page }) => {
  await page.goto("/products");
  const firstProduct = page.locator("a[href^='/products/']").first();
  await firstProduct.click();

  await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
  await page.getByRole("button", { name: /add to cart/i }).click();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: /your cart/i })).toBeVisible();

  await page.getByRole("link", { name: /checkout/i }).click();
  await expect(page).toHaveURL(/sign-in|checkout/);
});

test.skip("complete Stripe-test payment", async () => {
  // Implement once STRIPE_* keys + `stripe listen` are wired in CI.
});
