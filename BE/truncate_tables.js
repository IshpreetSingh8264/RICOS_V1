const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function truncateTables() {
  try {
    console.log('🗑️  Truncating tables...');
    
    // Delete in order to respect foreign key constraints
    await prisma.groupResourceAllocation.deleteMany({});
    console.log('✓ Cleared group_resource_allocations');
    
    await prisma.group.deleteMany({});
    console.log('✓ Cleared groups');
    
    await prisma.inventoryItem.deleteMany({});
    console.log('✓ Cleared inventory_items');
    
    // Optional: Clear all users too if you want a completely fresh start
    // Uncomment these lines if you want to clear everything:
    /*
    await prisma.responder.deleteMany({});
    await prisma.allUsers.deleteMany({});
    await prisma.nGO.deleteMany({});
    await prisma.volunteer.deleteMany({});
    await prisma.government.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✓ Cleared all users');
    */
    
    console.log('\n✅ Tables truncated successfully!');
    console.log('👉 Now logout, create a new NGO account, and try again.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

truncateTables();
