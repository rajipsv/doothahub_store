import { test, expect } from "@playwright/test";

/**
 * Happy path: browse → add to cart → reach checkout page.
 *
 * Full Razorpay-test payment is skipped here because it requires:
 *   1. Test-mode Razorpay keys (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)
 *   2. A webhook tunnelled to /api/webhooks/razorpay
 *
 * Enable the .skip below once those are wired into CI.
 */
test("browse → add to cart → checkout page", async ({ page }) => {
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

test.skip("complete Razorpay-test payment", async () => {
  // Implement once RAZORPAY_* keys + a webhook tunnel are wired in CI.
});
