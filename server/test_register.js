const fetch = require('node-fetch'); // Needs node-fetch v2 for CJS or dynamic import

// Using dynamic import for fetch since node-fetch v3 is ESM-only
async function testRegister() {
  const { default: fetch } = await import('node-fetch');

  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testadmin', password: 'password123' })
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Body:', text);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testRegister();
