import { expect, test, type Browser, type Page } from "@playwright/test";

const ACTIVE_SESSION_KEY = "pantas-active-session-v1";

const sessions = {
  petani: {
    role: "petani",
    email: "petani@demo.pantas.id",
    nama: "Pak Warsono",
    lokasi: "Pakem, Sleman — lereng Merapi",
    turSelesai: true,
  },
  pembeli: {
    role: "pembeli",
    email: "pembeli@demo.pantas.id",
    nama: "Rina Pradita",
    lokasi: "Umbulharjo, Yogyakarta",
    turSelesai: true,
  },
  admin: {
    role: "admin",
    email: "admin@demo.pantas.id",
    nama: "Operator Koperasi Tani DIY",
    lokasi: "Sleman, DI Yogyakarta",
    turSelesai: true,
  },
} as const;

async function pageFor(browser: Browser, session: (typeof sessions)[keyof typeof sessions]) {
  const context = await browser.newContext();
  await context.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: ACTIVE_SESSION_KEY, value: session },
  );
  return { context, page: await context.newPage() };
}

async function expectHeading(page: Page, path: string, name: string) {
  await page.goto(path);
  await expect(page).toHaveURL(new RegExp(`${path.replaceAll("/", "\\/")}/?$`));
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

test("web meneruskan health check ke grading engine asli", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);

  const body = await response.json();
  expect(body.ai_engine).toMatchObject({
    status: "online",
    galat: null,
    versi: "1.0.0",
  });
  expect(body.ai_engine.model_tersedia).toEqual([
    "carrot",
    "chili",
    "cucumber",
    "tomato",
  ]);
  expect(body.database.status).toBe("tidak_dikonfigurasi");
});

test("halaman demo publik siap dipakai", async ({ page }) => {
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Tiga akun yang sudah terisi, dan tiga menit untuk melihat semuanya",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Masuk sebagai Petani" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Masuk sebagai Pembeli" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Masuk sebagai Admin" })).toBeVisible();
});

test("layar privat mengalihkan pengunjung tanpa sesi", async ({ page }) => {
  await page.goto("/petani");
  await expect(page).toHaveURL(/\/masuk\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "PANTAS" })).toBeVisible();
});

test("sesi petani membuka dashboard petani", async ({ browser }) => {
  const { context, page } = await pageFor(browser, sessions.petani);
  try {
    await expectHeading(page, "/petani", "Beranda");
    await expect(page.getByRole("link", { name: "Mulai Pindai Baru" })).toBeVisible();
  } finally {
    await context.close();
  }
});

test("sesi pembeli membuka katalog pembeli", async ({ browser }) => {
  const { context, page } = await pageFor(browser, sessions.pembeli);
  try {
    await expectHeading(page, "/pembeli", "Katalog Panen");
  } finally {
    await context.close();
  }
});

test("sesi admin membuka observability panel", async ({ browser }) => {
  const { context, page } = await pageFor(browser, sessions.admin);
  try {
    await expectHeading(page, "/admin", "Ringkasan Platform & Operasional");
    await expect(page.getByText("Kesehatan Layanan AI & Database", { exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});
