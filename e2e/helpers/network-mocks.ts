import type { Page, Route } from "@playwright/test";

export async function mockJsonGet(
  page: Page,
  urlPattern: RegExp,
  body: unknown,
  status = 200
) {
  await page.route(urlPattern, async (route: Route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

export async function mockJsonPost(
  page: Page,
  urlPattern: RegExp,
  body: unknown,
  status = 200
) {
  await page.route(urlPattern, async (route: Route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}
