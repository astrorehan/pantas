import puppeteer from "puppeteer";
import lighthouse, { desktopConfig } from "lighthouse";

const STORAGE_KEY = "pantas-store-v1:anon";
const SESI_PETANI = {
  role: "petani",
  email: "petani@demo.pantas.id",
  nama: "Pak Warsono",
  lokasi: "Pakem, Sleman — lereng Merapi",
  turSelesai: true,
};

async function runAudit(isMobile = false) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--remote-debugging-port=9222"],
  });

  const page = await browser.newPage();
  await page.goto("http://localhost:3000/api/health", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    (key, value) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, value);
    },
    STORAGE_KEY,
    JSON.stringify({ sesi: SESI_PETANI }),
  );
  await page.close();

  const endpoint = browser.wsEndpoint();
  const endpointUrl = new URL(endpoint);
  const port = endpointUrl.port;

  const flags = {
    port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  };

  const config = isMobile
    ? {
        extends: "lighthouse:default",
        settings: {
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          formFactor: "mobile",
          screenEmulation: {
            mobile: true,
            width: 390,
            height: 844,
            deviceScaleFactor: 2,
            disabled: false,
          },
          throttlingMethod: "simulate",
          disableStorageReset: true,
        },
      }
    : {
        ...desktopConfig,
        settings: {
          ...desktopConfig.settings,
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          disableStorageReset: true,
        },
      };

  const runnerResult = await lighthouse("http://localhost:3000/petani", flags, config);
  const report = runnerResult.lhr;

  console.log(`\n========================================`);
  console.log(`LIGHTHOUSE AUDIT: /petani (${isMobile ? "MOBILE" : "DESKTOP"})`);
  console.log(`========================================`);

  for (const cat of Object.values(report.categories)) {
    const score = Math.round((cat.score || 0) * 100);
    console.log(`Category: ${cat.title.padEnd(20)} => ${score}/100`);
  }

  console.log(`\n--- FAILED / OPPORTUNITY AUDITS ---`);
  let failCount = 0;
  for (const [auditKey, audit] of Object.entries(report.audits)) {
    if (audit.score !== null && audit.score < 1) {
      failCount++;
      console.log(`\n[${audit.scoreDisplayMode || "score"}: ${audit.score}] ${audit.title} (${auditKey})`);
      if (audit.displayValue) console.log(`   DisplayValue: ${audit.displayValue}`);
      if (audit.explanation) console.log(`   Explanation: ${audit.explanation}`);
      if (audit.description) console.log(`   Description: ${audit.description}`);
      if (audit.details?.items?.length) {
        console.log(`   Items (${audit.details.items.length}):`, JSON.stringify(audit.details.items.slice(0, 3), null, 2));
      }
    }
  }
  if (failCount === 0) {
    console.log("All audits passed with 100% score!");
  }

  await browser.close();
  return report;
}

async function main() {
  console.log("Starting Mobile Audit...");
  await runAudit(true);
  console.log("\nStarting Desktop Audit...");
  await runAudit(false);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
