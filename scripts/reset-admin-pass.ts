import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

(async () => {
  try {
    // Use PrismaPg adapter the same way the app does
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    const prisma = new PrismaClient({ adapter });

    const email = "admin@example.com";
    const plain = "ChangeMe123!";
    const hash = await bcrypt.hash(plain, 10);

    await prisma.adminUser.upsert({
      where: { email },
      update: { password: hash, name: "Admin" },
      create: { email, password: hash, name: "Admin" },
    });

    console.log("Admin password reset to:", email, plain);
    await prisma.$disconnect();
  } catch (err) {
    console.error("ERROR resetting admin password:", err);
    process.exit(1);
  }
})();
