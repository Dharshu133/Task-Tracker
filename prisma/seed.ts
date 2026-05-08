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



  // Default Project
  const project = await prisma.project.upsert({
    where: { id: 'project-default-001' },
    update: {},
    create: {
      id: 'project-default-001',
      name: 'Welcome Project',
      orgId: org.id,
      statuses: {
        create: [
          { 
            name: 'To Do', 
            color: '#6B7280', 
            category: 'todo', 
            orderIndex: 0, 
            isDefault: true, 
            createdBy: admin.id 
          },
          { 
            name: 'In Progress', 
            color: '#3B82F6', 
            category: 'in_progress', 
            orderIndex: 1, 
            isDefault: true, 
            createdBy: admin.id 
          },
          { 
            name: 'Done', 
            color: '#10B981', 
            category: 'done', 
            orderIndex: 2, 
            isDefault: true, 
            createdBy: admin.id 
          },
        ]
      }
    },
  });
  console.log(`✅ Project: ${project.name}`);

  console.log('\n🎉 Seed complete!');
  console.log('   Admin login:  admin@acme.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
