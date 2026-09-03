const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNgo() {
  const ngoId = '8bcb8b22-e029-43f0-a337-2204809cbb8d';
  
  const ngo = await prisma.nGO.findUnique({
    where: { id: ngoId }
  });
  
  const allUser = await prisma.allUsers.findFirst({
    where: { ngo_id: ngoId }
  });
  
  console.log('NGO Record:', ngo ? 'EXISTS ✓' : 'NOT FOUND ✗');
  console.log('AllUsers Record:', allUser ? 'EXISTS ✓' : 'NOT FOUND ✗');
  
  if (!ngo) {
    console.log('\n❌ Problem: NGO ID from JWT does not exist in ngos table');
    console.log('Solution: Logout and create a new NGO account');
  } else {
    console.log('\n✓ NGO exists, checking email:', ngo.email);
  }
  
  await prisma.$disconnect();
}

checkNgo().catch(console.error);
