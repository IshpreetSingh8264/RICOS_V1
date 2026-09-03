const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAllUsers() {
  try {
    console.log('🗑️  Clearing all users and related data...');
    
    // Delete in reverse order of dependencies
    await prisma.groupResourceAllocation.deleteMany({});
    console.log('✓ Cleared group_resource_allocations');
    
    await prisma.group.deleteMany({});
    console.log('✓ Cleared groups');
    
    await prisma.inventoryItem.deleteMany({});
    console.log('✓ Cleared inventory_items');
    
    await prisma.responder.deleteMany({});
    console.log('✓ Cleared responders');
    
    await prisma.allUsers.deleteMany({});
    console.log('✓ Cleared all_users');
    
    await prisma.nGO.deleteMany({});
    console.log('✓ Cleared ngos');
    
    await prisma.volunteer.deleteMany({});
    console.log('✓ Cleared volunteers');
    
    await prisma.government.deleteMany({});
    console.log('✓ Cleared governments');
    
    await prisma.user.deleteMany({});
    console.log('✓ Cleared users');
    
    console.log('\n✅ All data cleared! Fresh start ready.');
    console.log('\n📋 Next steps:');
    console.log('1. Go to frontend and clear localStorage: localStorage.clear(); location.reload();');
    console.log('2. Create a new NGO account');
    console.log('3. Try creating inventory items');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllUsers();
