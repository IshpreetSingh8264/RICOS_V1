const fetch = require('node-fetch');

async function testNGOSignup() {
  const ngoData = {
    email: 'testngo@example.com',
    password: 'TestPassword123!',
    ngo_name: 'Test Relief Organization',
    registration_number: 'TEST-REG-12345',
    ngo_type: 'Relief Organization',
    year_established: 2020,
    mission_statement: 'Help people in need',
    official_contact: '+919876543210',
    alternate_contact: '+919876543211',
    website: 'https://testorg.com',
    registered_address: '123 Test Street, Test City, Test State 12345',
    operational_areas: ['Delhi', 'Mumbai', 'Bangalore'],
    location_lat: 28.6139,
    location_lng: 77.2090,
    admin_name: 'Admin Test',
    admin_designation: 'Director',
    admin_mobile: '+919876543210',
    admin_email: 'admin@testorg.com',
    aadhar_card: '123456789012',
    resource_types: ['Medical', 'Food', 'Shelter'],
    team_strength: 50,
    bank_account_number: '1234567890123456'
  };

  try {
    console.log('🚀 Testing NGO Signup...\n');
    console.log('Sending data:', JSON.stringify(ngoData, null, 2));
    
    const response = await fetch('http://localhost:3000/auth/signup/ngo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ngoData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! NGO created');
      console.log('Token:', result.access_token);
      console.log('User Type:', result.user_type);
    } else {
      console.log('\n❌ FAILED!');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testNGOSignup();
