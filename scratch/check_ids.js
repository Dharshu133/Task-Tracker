const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const projects = await prisma.project.findMany();
  console.log('Projects:', JSON.stringify(projects, null, 2));
  
  const statuses = await prisma.projectTaskStatus.findMany();
  console.log('Statuses:', JSON.stringify(statuses, null, 2));
  
  await prisma.$disconnect();
}

check();
