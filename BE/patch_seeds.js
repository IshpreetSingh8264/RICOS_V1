const fs = require('fs');

const orig = fs.readFileSync('scripts/reset_and_seed_realistic_data.js', 'utf8');
const enhanced = fs.readFileSync('scripts/enhanced_seed.js', 'utf8');

// The original file is what we want to keep, but modify `createUser` and add Govt/Volunteers.

