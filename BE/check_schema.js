const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Try to query with remaining_quantity to see if column exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Current columns in inventory_items table:');
    result.forEach(col => console.log('  -', col.column_name));
    
    const hasRemainingQty = result.some(col => col.column_name === 'remaining_quantity');
    
    if (hasRemainingQty) {
      console.log('\n❌ ERROR: remaining_quantity column STILL EXISTS in database!');
      console.log('📝 The migration was not applied. Run:');
      console.log('   cd BE && npx prisma migrate dev --name remove_remaining_quantity');
    } else {
      console.log('\n✅ Schema is correct - remaining_quantity column does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
