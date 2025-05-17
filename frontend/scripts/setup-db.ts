import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing mock data
    await prisma.user.deleteMany();
    
    // Create demo admin account
    const hashedPassword = await hash('password123', 10);
    
    const demoAdmin = await prisma.user.create({
      data: {
        email: 'admin@vineyard.edu',
        name: 'Demo Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    
    console.log('✅ Database setup complete');
    console.log('Created demo admin:', demoAdmin);
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 