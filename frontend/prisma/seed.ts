import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if admin account already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@vineyard.edu' },
    });

    if (!existingAdmin) {
      // Create admin user
      await prisma.user.create({
        data: {
          email: 'admin@vineyard.edu',
          name: 'Admin User',
          password: await bcrypt.hash('password123', 10),
          role: 'ADMIN',
        },
      });
      console.log('✅ Demo admin account created successfully');
    } else {
      console.log('ℹ️ Demo admin account already exists, skipping creation');
    }

    // Create a demo class
    const existingClass = await prisma.class.findFirst({
      where: { grade: 10, section: 'A' },
    });

    if (!existingClass) {
      await prisma.class.create({
        data: {
          grade: 10,
          section: 'A',
        },
      });
      console.log('✅ Demo class created successfully');
    }

    // Create a demo teacher account
    const existingTeacher = await prisma.user.findUnique({
      where: { email: 'teacher@vineyard.edu' },
    });

    if (!existingTeacher) {
      await prisma.user.create({
        data: {
          email: 'teacher@vineyard.edu',
          name: 'Teacher User',
          password: await bcrypt.hash('password123', 10),
          role: 'TEACHER',
        },
      });
      console.log('✅ Demo teacher account created successfully');
    }

    // Create a demo student account
    const existingStudent = await prisma.user.findUnique({
      where: { email: 'student@vineyard.edu' },
    });

    if (!existingStudent) {
      // Get the class
      const demoClass = await prisma.class.findFirst({
        where: { grade: 10, section: 'A' },
      });

      if (demoClass) {
        await prisma.user.create({
          data: {
            email: 'student@vineyard.edu',
            name: 'Student User',
            password: await bcrypt.hash('password123', 10),
            role: 'STUDENT',
            classId: demoClass.id,
          },
        });
        console.log('✅ Demo student account created successfully');
      }
    }

    console.log('🌱 Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 