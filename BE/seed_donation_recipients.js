require('dotenv').config({ path: './common.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDonationRecipients() {
  try {
    console.log('🌱 Seeding donation recipients...\n');

    // Check existing verified organizations
    const existingNGOs = await prisma.nGO.count({ where: { isVerified: true } });
    const existingGovts = await prisma.government.count({ where: { isVerified: true } });
    const existingVolunteers = await prisma.volunteer.count();

    console.log('📊 Current Database Status:');
    console.log(`   Verified NGOs: ${existingNGOs}`);
    console.log(`   Verified Government: ${existingGovts}`);
    console.log(`   Volunteers: ${existingVolunteers}\n`);

    // List all organizations (verified or not)
    const allNGOs = await prisma.nGO.findMany({
      select: {
        id: true,
        ngo_name: true,
        isVerified: true,
        email: true,
      }
    });

    const allGovts = await prisma.government.findMany({
      select: {
        id: true,
        agency_name: true,
        isVerified: true,
        email: true,
      }
    });

    const allVolunteers = await prisma.volunteer.findMany({
      select: {
        id: true,
        group_name: true,
        email: true,
      }
    });

    console.log('📋 All Organizations in Database:\n');
    
    if (allNGOs.length > 0) {
      console.log('NGOs:');
      allNGOs.forEach(ngo => {
        console.log(`   ${ngo.isVerified ? '✅' : '❌'} ${ngo.ngo_name} (${ngo.email})`);
      });
      console.log();
    }

    if (allGovts.length > 0) {
      console.log('Government Agencies:');
      allGovts.forEach(govt => {
        console.log(`   ${govt.isVerified ? '✅' : '❌'} ${govt.agency_name} (${govt.email})`);
      });
      console.log();
    }

    if (allVolunteers.length > 0) {
      console.log('Volunteer Groups:');
      allVolunteers.forEach(vol => {
        console.log(`   ✅ ${vol.group_name} (${vol.email})`);
      });
      console.log();
    }

    // Verify all unverified organizations
    if (allNGOs.some(ngo => !ngo.isVerified)) {
      console.log('🔓 Verifying all NGOs...');
      await prisma.nGO.updateMany({
        where: { isVerified: false },
        data: { isVerified: true }
      });
      console.log('✅ All NGOs verified\n');
    }

    if (allGovts.some(govt => !govt.isVerified)) {
      console.log('🔓 Verifying all Government agencies...');
      await prisma.government.updateMany({
        where: { isVerified: false },
        data: { isVerified: true }
      });
      console.log('✅ All Government agencies verified\n');
    }

    // Note: If you need to create sample organizations, you should do it through the signup forms
    // as they have the correct required fields and AllUsers relationship
    if (allNGOs.length === 0 && allGovts.length === 0 && allVolunteers.length === 0) {
      console.log('⚠️  No organizations found in database.');
      console.log('   Please sign up organizations through the frontend signup forms:\n');
      console.log('   - NGO Signup: http://localhost:5174/signup/ngo');
      console.log('   - Government Signup: http://localhost:5174/signup/govt');
      console.log('   - Volunteer Signup: http://localhost:5174/signup/volunteer\n');
    }

    // Final count
    const finalNGOs = await prisma.nGO.count({ where: { isVerified: true } });
    const finalGovts = await prisma.government.count({ where: { isVerified: true } });
    const finalVolunteers = await prisma.volunteer.count();

    console.log('✨ Final Status:');
    console.log(`   Verified NGOs: ${finalNGOs}`);
    console.log(`   Verified Government: ${finalGovts}`);
    console.log(`   Volunteers: ${finalVolunteers}`);
    console.log(`   Total Available Recipients: ${finalNGOs + finalGovts + finalVolunteers}\n`);

    console.log('✅ Done! Organizations are now available for donations.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDonationRecipients();
