/* eslint-disable @typescript-eslint/no-require-imports */
require("ts-node/register/transpile-only");

const { ensureDefaults } = require("../lib/seed.ts");

async function main() {
  try {
    await ensureDefaults();
    console.log("Default data seeded successfully.");
  } catch (error) {
    console.error("Failed to seed default data.");
    console.error(error);
    process.exitCode = 1;
  }
}

main();
