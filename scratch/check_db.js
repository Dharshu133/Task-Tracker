const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const statuses = await prisma.projectTaskStatus.findMany();
  console.log('Statuses:', JSON.stringify(statuses, null, 2));
  const tasks = await prisma.task.findMany({ take: 5 });
  console.log('Tasks:', JSON.stringify(tasks, null, 2));
  process.exit(0);
}

check();
