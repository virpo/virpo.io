import { expect, test, type Page } from "@playwright/test";

const routes = [
  { path: "/", current: "Virpo home" },
  { path: "/blog/", current: "Blog" },
  { path: "/projects/", current: "Projects" },
  { path: "/blog/weird-use-of-ai-3/", current: "Blog" },
  { path: "/blog/weird-use-of-ai-1/", current: "Blog" },
  { path: "/blog/a-different-kind-of-hackathon/", current: "Blog" },
] as const;

const articlePaths = routes.slice(3).map(({ path }) => path);

async function blockThirdPartyTrain(page: Page) {
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Train placeholder</title>",
    }),
  );
}

test.describe("static route contracts", () => {
  for (const route of routes) {
    test(`${route.path} has one clear page, metadata, and no product errors`, async ({
      page,
      request,
      baseURL,
    }) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      const failedLocalResponses: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("response", (response) => {
        if (
          new URL(response.url()).origin === new URL(baseURL ?? "").origin &&
          response.status() >= 400
        ) {
          failedLocalResponses.push(`${response.status()} ${response.url()}`);
        }
      });
      await blockThirdPartyTrain(page);

      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator(".siteFooter")).toHaveCount(1);
      await expect(
        page.getByRole("link", { name: route.current, exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(canonical).toBe(`https://virpo.io${route.path}`);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(100);
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);

      const localLinks = await page
        .locator('a[href^="/"]')
        .evaluateAll((links) =>
          [...new Set(links.map((link) => (link as HTMLAnchorElement).href))],
        );
      for (const href of localLinks) {
        const linked = await request.get(href);
        expect(linked.status(), href).toBeLessThan(400);
      }

      const brokenImages = await page
        .locator("img")
        .evaluateAll((images) =>
          images
            .filter(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth === 0,
            )
            .map((image) => (image as HTMLImageElement).src),
        );
      expect(brokenImages).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(failedLocalResponses).toEqual([]);
    });
  }

  test("blog index stays a minimal three-entry list", async ({ page }) => {
    await page.goto("/blog/");
    const posts = page.getByRole("list", { name: "Posts" }).getByRole("article");
    await expect(posts).toHaveCount(3);
    await expect(page.locator(".blogIndex img")).toHaveCount(0);
    for (const post of await posts.all()) {
      await expect(post.locator("time")).toHaveCount(1);
      await expect(post.locator("h2 a")).toHaveCount(1);
      await expect(post.locator(".articleTags li")).not.toHaveCount(0);
    }
  });

  for (const path of articlePaths) {
    test(`${path} keeps the editorial article contract`, async ({ page }) => {
      await page.goto(path);
      const article = page.locator(".articlePage");
      await expect(article.locator(":scope > .articleHeader time")).toHaveCount(1);
      await expect(article.locator(":scope > .articleHeader .articleTags li")).not.toHaveCount(0);
      await expect(article.locator(".articleBody p")).not.toHaveCount(0);
      await expect(article.locator(".articleMedia img")).not.toHaveCount(0);
      await expect(article.getByRole("navigation", { name: "Continue exploring" }).getByRole("link")).toHaveCount(3);
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
      const jsonLd = JSON.parse(
        (await page.locator('script[type="application/ld+json"]').textContent()) ??
          "{}",
      );
      expect(jsonLd["@type"]).toBe("Article");
      expect(jsonLd.url).toBe(`https://virpo.io${path}`);

      const copyWidth = await article
        .locator(".articleBody > p")
        .first()
        .evaluate((paragraph) => paragraph.getBoundingClientRect().width);
      expect(copyWidth).toBeLessThanOrEqual(704);
    });
  }
});

test("Bloom supports pointer, keyboard, Source, and Escape", async ({ page }) => {
  await blockThirdPartyTrain(page);
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Open Japan bloom details",
  });
  const dialog = page.getByRole("dialog", { name: "Japan bloom details" });

  await trigger.hover();
  await expect(dialog).toBeVisible();
  await page.mouse.move(1, 900);
  await expect(dialog).toBeHidden();

  await trigger.focus();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: /Source/ }).focus();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(dialog).toBeVisible();
  await trigger.click();
  await expect(dialog).toBeHidden();
});

test("Tab order reaches navigation, Bloom, Source, and sound playback", async ({
  page,
}) => {
  await blockThirdPartyTrain(page);
  await page.goto("/");
  const primary = page.getByRole("navigation", { name: "Primary" });
  const expected = [
    page.getByRole("link", { name: "Virpo home" }),
    primary.getByRole("link", { name: "Blog", exact: true }),
    primary.getByRole("link", { name: "Projects", exact: true }),
    primary.getByRole("link", { name: "About", exact: true }),
    page.getByRole("button", { name: "Open Japan bloom details" }),
    page.getByRole("link", { name: /Source/ }),
    page.getByRole("button", { name: /Play FamilyMart/ }),
  ];

  for (const [index, target] of expected.entries()) {
    await page.keyboard.press("Tab");
    await expect(target).toBeFocused();
    if (index === 4) {
      expect(await target.evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe(
        "none",
      );
    }
  }
  await page.keyboard.press("Enter");
  const pause = page.getByRole("button", { name: /Pause FamilyMart/ });
  await expect(pause).toBeFocused();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: /Play FamilyMart/ }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("face remains square and reacts only to a fine pointer", async ({
  page,
  browser,
}) => {
  await blockThirdPartyTrain(page);
  await page.goto("/");
  const face = page.getByRole("region", {
    name: "Peter's interactive face",
  });
  const image = face.locator("img");
  const before = await image.getAttribute("src");
  const box = await face.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs((box?.width ?? 0) - (box?.height ?? 0))).toBeLessThan(1);
  await page.mouse.move((box?.x ?? 0) + 10, (box?.y ?? 0) + 10);
  await expect(image).not.toHaveAttribute("src", before ?? "");

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const mobile = await context.newPage();
  await blockThirdPartyTrain(mobile);
  await mobile.goto("/");
  const mobileImage = mobile
    .getByRole("region", { name: "Peter's interactive face" })
    .locator("img");
  const neutral = await mobileImage.getAttribute("src");
  await mobile.touchscreen.tap(20, 300);
  await expect(mobileImage).toHaveAttribute("src", neutral ?? "");
  await context.close();
});

test("mobile preserves face, Sounds, Window Seat, Study, intro, writing order", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await blockThirdPartyTrain(page);
  await page.goto("/");

  const labels = await page.locator(".homeBento [aria-label]").evaluateAll((nodes) =>
    nodes
      .map((node) => node.getAttribute("aria-label"))
      .filter((label) =>
        [
          "Peter's interactive face",
          "Familiar Japanese Sounds",
          "Window Seat",
          "Japanese Study",
          "About Peter",
          "Latest writing",
        ].includes(label ?? ""),
      ),
  );
  expect(labels).toEqual([
    "Peter's interactive face",
    "Familiar Japanese Sounds",
    "Window Seat",
    "Japanese Study",
    "About Peter",
    "Latest writing",
  ]);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("Sounds exposes waveform, play/pause, rapid next, and error fallback", async ({
  page,
}) => {
  await blockThirdPartyTrain(page);
  await page.goto("/");
  const sounds = page.getByRole("region", {
    name: "Familiar Japanese Sounds",
  });
  const waveform = sounds.getByRole("img", { name: "Sound waveform" });
  const audio = sounds.locator("audio");
  const play = sounds.getByRole("button", { name: /Play FamilyMart/ });

  await expect(waveform).toHaveAttribute("data-waveform-state", "idle");
  await play.click();
  await expect(sounds.getByRole("button", { name: /Pause FamilyMart/ })).toBeVisible();
  await expect.poll(() => audio.evaluate((node) => !node.paused)).toBe(true);
  await expect(waveform).toHaveAttribute("data-waveform-state", "live");
  await sounds.getByRole("button", { name: /Pause FamilyMart/ }).click();
  await expect.poll(() => audio.evaluate((node) => node.paused)).toBe(true);
  await expect(waveform).toHaveAttribute("data-waveform-state", "idle");

  await sounds.getByRole("button", { name: /Play Departure melody/ }).click();
  const next = sounds.getByRole("button", { name: "Next sound" });
  await next.click();
  await next.click();
  await next.click();
  await expect(sounds.getByText("Railway crossing", { exact: true })).toBeVisible();
  await expect(
    sounds.getByRole("group", { name: "Sound navigation" }),
  ).toHaveAttribute("aria-busy", "false");
  await expect.poll(() => audio.evaluate((node) => !node.paused)).toBe(true);

  await audio.evaluate((node) => node.dispatchEvent(new Event("error")));
  await expect(sounds.getByText("Sound unavailable")).toBeVisible();
  await expect(
    sounds.getByRole("button", { name: /Play Railway crossing/ }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("Window Seat stays unobstructed, unzoomed, and inert", async ({ page }) => {
  await blockThirdPartyTrain(page);
  await page.goto("/");
  const windowSeat = page.getByRole("region", { name: "Window Seat" });
  const frame = windowSeat.locator("iframe");
  await expect(frame).toHaveAttribute("src", /youtube-nocookie\.com/);
  await expect(frame).toHaveCSS("transform", "none");
  await expect(frame).toHaveCSS("pointer-events", "none");
  await expect(frame).toHaveAttribute("tabindex", "-1");
  for (const id of [
    "youtube-mask-top",
    "youtube-mask-bottom",
    "youtube-mask-left",
    "youtube-mask-right",
    "youtube-subtitle-mask",
  ]) {
    await expect(windowSeat.getByTestId(id)).toHaveCount(0);
  }
  await expect(windowSeat.getByTestId("youtube-compass-mask")).toBeVisible();
});

test("reduced motion leaves the train blank and makes no YouTube request", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const youtubeRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("youtube")) youtubeRequests.push(request.url());
  });
  await page.goto("/");
  const windowSeat = page.getByRole("region", { name: "Window Seat" });
  await expect(windowSeat.locator("iframe")).toHaveAttribute("src", "about:blank");
  await expect(windowSeat.locator("iframe")).toHaveCSS("visibility", "hidden");
  await expect(windowSeat).toHaveAttribute("data-reduced-motion", "true");
  expect(youtubeRequests).toEqual([]);
  await context.close();
});

test("Study randomizes, reveals, focuses, persists, migrates, and unlocks", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.72;
  });
  await blockThirdPartyTrain(page);
  await page.goto("/");
  const study = page.getByRole("region", { name: "Japanese Study" });
  const firstCard = study.getByRole("button", { name: /Reveal answer/ });
  await expect(firstCard).toBeVisible();
  await expect(firstCard.locator("strong")).not.toHaveText("あ");

  await firstCard.click();
  await expect(study.getByRole("group", { name: "Rate this answer" })).toBeVisible();
  await study.getByRole("button", { name: "Got it" }).click();
  await expect(study.getByRole("button", { name: /Reveal answer/ })).toBeFocused();
  expect(
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("virpo-study-v2") ?? "{}");
      return Object.values<{ correct: number }>(state.cards).filter(
        (card) => card.correct === 1,
      ).length;
    }),
  ).toBe(1);
  await page.reload();
  expect(
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("virpo-study-v2") ?? "{}");
      return Object.values<{ correct: number }>(state.cards).filter(
        (card) => card.correct === 1,
      ).length;
    }),
  ).toBe(1);

  const legacy = JSON.stringify({
    version: 1,
    cards: {
      "h-a": { stage: 2, dueAt: 0, correct: 2, wrong: 1 },
    },
  });
  await page.evaluate((raw) => {
    localStorage.clear();
    localStorage.setItem("virpo-study-v1", raw);
  }, legacy);
  await page.reload();
  await expect(study.getByText(/1 \/ 46 stable/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("virpo-study-v1"))).toBe(
    legacy,
  );
  expect(await page.evaluate(() => localStorage.getItem("virpo-study-v2"))).not.toBeNull();

  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("virpo-study-v2") ?? "{}");
    const future = Date.now() + 600_000;
    for (const progress of Object.values<{
      stage: number;
      dueAt: number;
      correct: number;
      wrong: number;
    }>(state.cards)) {
      progress.dueAt = future;
    }
    for (const id of Object.keys(state.cards).filter((id) => id.startsWith("h-")).slice(0, 37)) {
      state.cards[id] = { stage: 2, dueAt: future, correct: 2, wrong: 0 };
    }
    state.cards["k-a"].dueAt = 0;
    localStorage.setItem("virpo-study-v2", JSON.stringify(state));
  });
  await page.reload();
  await expect(study.getByText("Katakana", { exact: true })).toBeVisible();
  await expect(study.getByText("ア", { exact: true })).toBeVisible();

  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("virpo-study-v2") ?? "{}");
    const future = Date.now() + 600_000;
    for (const id of Object.keys(state.cards).filter((id) => id.startsWith("k-")).slice(0, 37)) {
      state.cards[id] = { stage: 2, dueAt: future, correct: 2, wrong: 0 };
    }
    state.cards["k-a"].dueAt = future;
    state.cards["v-mizu"].dueAt = 0;
    localStorage.setItem("virpo-study-v2", JSON.stringify(state));
  });
  await page.reload();
  await expect(study.getByText("Kanji · landscape", { exact: true })).toBeVisible();
  await expect(study.getByText("水", { exact: true })).toBeVisible();
  await expect(study.getByText("みず", { exact: true })).toBeVisible();
  await expect(study.getByText("water", { exact: true })).toBeHidden();
  await study.getByRole("button", { name: /Reveal answer/ }).click();
  await expect(study.getByText("water", { exact: true })).toBeVisible();
});

test("projects render six cards in 3 / 2 / 1 responsive columns", async ({
  page,
}) => {
  await page.goto("/projects/");
  const cards = page.getByTestId("project-card");
  await expect(cards).toHaveCount(6);

  async function columnCount() {
    return cards.evaluateAll(
      (nodes) =>
        new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().x)))
          .size,
    );
  }

  expect(await columnCount()).toBe(3);
  await page.setViewportSize({ width: 700, height: 900 });
  expect(await columnCount()).toBe(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await columnCount()).toBe(1);
});
