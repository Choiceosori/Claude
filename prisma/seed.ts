import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("teacher1234", 10);
  await prisma.teacher.upsert({
    where: { username: "teacher" },
    update: {},
    create: {
      username: "teacher",
      passwordHash,
      name: "김선생",
    },
  });

  const assignments = [
    {
      title: "학교종",
      instrument: "리코더",
      guideType: "recorder",
      targetGrade: 3,
      description: "1절을 처음부터 끝까지 틀리지 않고 연주해 봅시다.",
    },
    {
      title: "비행기",
      instrument: "리코더",
      guideType: "recorder",
      targetGrade: 3,
      description: "박자를 일정하게 유지하며 연주해 봅시다.",
    },
    {
      title: "작은별",
      instrument: "핸드벨",
      guideType: "handbell",
      targetGrade: 4,
      description: "모둠원과 순서를 맞춰 연주하는 모습을 녹화합니다.",
    },
  ];

  for (const a of assignments) {
    const existing = await prisma.assignment.findFirst({
      where: { title: a.title, instrument: a.instrument },
    });
    if (!existing) {
      await prisma.assignment.create({ data: a });
    }
  }

  console.log("Seed complete. Teacher login -> username: teacher / password: teacher1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
