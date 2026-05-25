import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /modern shopping/i })).toBeVisible();
  });

  test("products page lists items", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /all products/i })).toBeVisible();
  });

  test("empty cart shows CTA", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });

  test("sign-in page is reachable", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });
});
