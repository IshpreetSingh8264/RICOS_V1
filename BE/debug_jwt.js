// Debug script to decode JWT token
// Usage: node debug_jwt.js YOUR_JWT_TOKEN

const jwt = require('jsonwebtoken');

const token = process.argv[2];

if (!token) {
  console.error('Please provide a JWT token as an argument');
  console.log('Usage: node debug_jwt.js YOUR_JWT_TOKEN');
  process.exit(1);
}

try {
  const decoded = jwt.decode(token);
  console.log('Decoded JWT payload:');
  console.log(JSON.stringify(decoded, null, 2));
  
  console.log('\n--- Key fields ---');
  console.log('sub (userId):', decoded.sub);
  console.log('email:', decoded.email);
  console.log('userType:', decoded.userType);
  console.log('role:', decoded.role);
  console.log('full_name:', decoded.full_name);
} catch (error) {
  console.error('Error decoding token:', error.message);
}
