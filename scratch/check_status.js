const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const statusId = '5d9060cf-aa8c-49e6-b7fc-706d054a4534';
  const status = await prisma.projectTaskStatus.findUnique({
    where: { id: statusId },
    include: { project: true }
  });
  console.log('Status:', JSON.stringify(status, null, 2));
  
  const allStatuses = await prisma.projectTaskStatus.findMany({
    take: 5
  });
  console.log('Sample Statuses:', JSON.stringify(allStatuses, null, 2));
  
  await prisma.$disconnect();
}

check();
