import { PrismaClient } from "@prisma/client";
import { seedCities, preserveExistingUserCities } from "../lib/city-seed";

const prisma = new PrismaClient();

async function main() {
  const result = await seedCities(prisma);
  await preserveExistingUserCities(prisma);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
