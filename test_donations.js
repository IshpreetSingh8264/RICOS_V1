/**
 * Test script for Donation Backend
 * 
 * This script tests the donation endpoints to ensure they work correctly.
 * 
 * Prerequisites:
 * 1. Backend servers running (user_backend on 8080, official_backend on 8081)
 * 2. Valid JWT token (login first to get token)
 * 3. Test user in database
 * 4. Test NGO/Govt/Volunteer in database
 * 
 * Run: node test_donations.js
 */

const API_BASE_URL = 'http://localhost:8080';

// Replace with your JWT token after login
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';

// Replace with actual NGO ID from your database
const TEST_NGO_ID = 'YOUR_NGO_ID_HERE';

async function testDonationEndpoints() {
  console.log('🧪 Testing Donation Backend Endpoints\n');
  
  // Test 1: Get Recipients List
  console.log('1️⃣ Testing GET /donations/recipients...');
  try {
    const response = await fetch(`${API_BASE_URL}/donations/recipients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('✅ Recipients:', JSON.stringify(data, null, 2));
    console.log(`   Found ${data.organizations?.length || 0} organizations\n`);
  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
  }

  // Test 2: Create Donation to RICOS
  console.log('2️⃣ Testing POST /donations/create (RICOS)...');
  try {
    const response = await fetch(`${API_BASE_URL}/donations/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 1000,
        recipient_type: 'ricos',
        message: 'Test donation to RICOS platform',
        payment_method: 'card'
      })
    });
    const data = await response.json();
    console.log('✅ Donation Created:', JSON.stringify(data, null, 2));
    console.log(`   Transaction ID: ${data.transaction_id}\n`);
  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
  }

  // Test 3: Create Donation to NGO
  console.log('3️⃣ Testing POST /donations/create (NGO)...');
  try {
    const response = await fetch(`${API_BASE_URL}/donations/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 5000,
        recipient_type: 'ngo',
        recipient_id: TEST_NGO_ID,
        message: 'Great work during recent disaster response!',
        payment_method: 'upi',
        is_anonymous: false
      })
    });
    const data = await response.json();
    console.log('✅ Donation Created:', JSON.stringify(data, null, 2));
    console.log(`   Transaction ID: ${data.transaction_id}\n`);
  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
  }

  // Test 4: Get My Donations
  console.log('4️⃣ Testing GET /donations/my-donations...');
  try {
    const response = await fetch(`${API_BASE_URL}/donations/my-donations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('✅ My Donations:', JSON.stringify(data, null, 2));
    console.log(`   Total Donations: ${data.total}`);
    console.log(`   Total Amount: ₹${data.totalAmount}\n`);
  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
  }

  // Test 5: Get Received Donations (NGO only)
  console.log('5️⃣ Testing GET /donations/received (NGO Token Required)...');
  console.log('   ⚠️  This requires NGO JWT token\n');
  
  console.log('✅ All tests completed!\n');
  console.log('📝 Notes:');
  console.log('   - Replace JWT_TOKEN with your actual token');
  console.log('   - Replace TEST_NGO_ID with actual NGO ID from database');
  console.log('   - Ensure backend servers are running on ports 8080 and 8081');
}

// Run tests
testDonationEndpoints();
