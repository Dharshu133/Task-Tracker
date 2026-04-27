import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  // Organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-acme-001' },
    update: {},
    create: {
      id: 'org-acme-001',
      name: 'Acme Corp',
    },
  });
  console.log(`✅ Organization: ${org.name}`);

  // Admin user
  const password = 'password123';
  const hashedSeedPassword = await bcrypt.hash(password, 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {
      password: hashedSeedPassword,
    },
    create: {
      email: 'admin@acme.com',
      password: hashedSeedPassword,
      role: 'ADMIN',
      orgId: org.id,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Member user
  const member = await prisma.user.upsert({
    where: { email: 'member@acme.com' },
    update: {
      password: hashedSeedPassword,
    },
    create: {
      email: 'member@acme.com',
      password: hashedSeedPassword,
      role: 'MEMBER',
      orgId: org.id,
    },
  });

  console.log(`✅ Member: ${member.email}`);

  // Projects
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-001' },
    update: {},
    create: {
      id: 'proj-001',
      name: 'Website Redesign',
      orgId: org.id,
    },
  });
  const project2 = await prisma.project.upsert({
    where: { id: 'proj-002' },
    update: {},
    create: {
      id: 'proj-002',
      name: 'Mobile App Launch',
      orgId: org.id,
    },
  });
  console.log(`✅ Projects: ${project1.name}, ${project2.name}`);

  // Tasks
  const tasks = [
    {
      id: 'task-001',
      title: 'Design new landing page',
      description: 'Create wireframes and high-fidelity mockups for the homepage.',
      status: 'OPEN' as const,
      projectId: project1.id,
      createdBy: admin.id,
      assigneeId: member.id,
    },
    {
      id: 'task-002',
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment.',
      status: 'IN_PROGRESS' as const,
      projectId: project1.id,
      createdBy: admin.id,
      assigneeId: admin.id,
    },
    {
      id: 'task-003',
      title: 'Write API documentation',
      description: 'Document all REST endpoints using OpenAPI spec.',
      status: 'OPEN' as const,
      projectId: project1.id,
      createdBy: member.id,
      assigneeId: null,
    },
    {
      id: 'task-004',
      title: 'Fix login page bug',
      description: 'Password validation not working on iOS Safari.',
      status: 'CLOSED' as const,
      projectId: project2.id,
      createdBy: admin.id,
      assigneeId: member.id,
    },
    {
      id: 'task-005',
      title: 'Design onboarding flow',
      description: 'Create user onboarding screens for the mobile app.',
      status: 'IN_PROGRESS' as const,
      projectId: project2.id,
      createdBy: member.id,
      assigneeId: member.id,
    },
    {
      id: 'task-006',
      title: 'Performance optimization',
      description: null,
      status: 'OPEN' as const,
      projectId: project2.id,
      createdBy: admin.id,
      assigneeId: null,
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }
  console.log(`✅ Tasks: ${tasks.length} seeded`);

  console.log('\n🎉 Seed complete!');
  console.log('   Admin login:  admin@acme.com / password123');
  console.log('   Member login: member@acme.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
