const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testNGOInventory() {
  console.log('=== NGO Inventory Test ===\n');

  // Step 1: Check all NGOs in the database
  console.log('Step 1: Checking NGOs in database...');
  const ngos = await prisma.nGO.findMany({
    select: {
      id: true,
      ngo_name: true,
      email: true,
      createdAt: true,
    },
  });
  console.log(`Found ${ngos.length} NGOs:`);
  ngos.forEach((ngo, index) => {
    console.log(`  ${index + 1}. ${ngo.ngo_name} (${ngo.email})`);
    console.log(`     ID: ${ngo.id}`);
    console.log(`     Created: ${ngo.createdAt}`);
  });

  if (ngos.length === 0) {
    console.log('\n❌ ERROR: No NGOs found in database!');
    console.log('Please sign up an NGO first before creating inventory.');
    await prisma.$disconnect();
    return;
  }

  // Step 2: Check AllUsers table for NGO entries
  console.log('\nStep 2: Checking AllUsers table for NGO entries...');
  const allUsers = await prisma.allUsers.findMany({
    where: { user_type: 'ngo' },
    select: {
      id: true,
      email: true,
      full_name: true,
      ngo_id: true,
    },
  });
  console.log(`Found ${allUsers.length} NGO users in AllUsers table:`);
  allUsers.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.full_name} (${user.email})`);
    console.log(`     AllUsers ID: ${user.id}`);
    console.log(`     NGO ID: ${user.ngo_id}`);
  });

  // Step 3: Check inventory items
  console.log('\nStep 3: Checking existing inventory items...');
  const inventoryItems = await prisma.inventoryItem.findMany({
    include: {
      ngo: {
        select: {
          ngo_name: true,
        },
      },
    },
  });
  console.log(`Found ${inventoryItems.length} inventory items:`);
  inventoryItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.item} - Quantity: ${item.total_quantity}`);
    console.log(`     NGO: ${item.ngo?.ngo_name || 'None'}`);
    console.log(`     NGO ID: ${item.ngo_id || 'None'}`);
  });

  // Step 4: Provide instructions
  console.log('\n=== Instructions ===');
  console.log('To test inventory creation:');
  console.log('1. Log in with your NGO credentials');
  console.log('2. Copy the JWT token from the login response');
  console.log('3. Run: node debug_jwt.js YOUR_JWT_TOKEN');
  console.log('4. Verify that the "sub" field matches one of the NGO IDs above');
  console.log('\nIf the "sub" field does NOT match any NGO ID:');
  console.log('  - You may be using an old token from before the fix');
  console.log('  - Log out and log in again to get a fresh token');
  console.log('\nAvailable NGO IDs:');
  ngos.forEach((ngo, index) => {
    console.log(`  ${index + 1}. ${ngo.id} - ${ngo.ngo_name}`);
  });

  await prisma.$disconnect();
}

testNGOInventory().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
