// src/seed.ts
import DataSource from "../typeorm.config";
import { MainSeeder } from "./MainSeeder";

const runSeed = async () => {
  try {
    await DataSource.initialize(); // Kết nối DB

    const mainSeeder = new MainSeeder(DataSource);
    await mainSeeder.run(); // Chạy toàn bộ seeder

    console.log("All seeds executed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

runSeed();