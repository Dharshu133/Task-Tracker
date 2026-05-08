const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const statuses = await prisma.projectTaskStatus.findMany({
      select: { id: true, projectId: true, name: true }
    });
    console.log('Statuses:', JSON.stringify(statuses, null, 2));
    const projects = await prisma.project.findMany({
      select: { id: true, name: true }
    });
    console.log('Projects:', JSON.stringify(projects, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
