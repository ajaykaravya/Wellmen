import { ensureDefaults } from "@/lib/seed";

async function main() {
  try {
    await ensureDefaults();
    console.log("Default data seeded successfully.");
  } catch (error) {
    console.error("Failed to seed default data.");
    console.error(error);
    process.exit(1);
  }
}

main();