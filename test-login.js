const http = require('http');

function makeRequest(method, path, body) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, body: response });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ status: 'ERROR', error: error.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testLogin() {
  console.log('=== LOGIN AUTHENTICATION TEST ===\n');

  const testCases = [
    { name: 'Admin Login', email: 'admin@example.com', password: 'password123', shouldPass: true },
    { name: 'Staff Login', email: 'staff@example.com', password: 'password123', shouldPass: true },
    { name: 'Client Login', email: 'client@example.com', password: 'password123', shouldPass: true },
    { name: 'Invalid Password', email: 'admin@example.com', password: 'wrongpassword', shouldPass: false },
    { name: 'Non-existent User', email: 'nonexistent@example.com', password: 'password123', shouldPass: false }
  ];

  for (const test of testCases) {
    process.stdout.write(`Testing "${test.name}"... `);
    
    const response = await makeRequest('POST', '/api/auth/login', {
      email: test.email,
      password: test.password
    });

    console.log(`[Status: ${response.status}]`, response.body);

    if (test.shouldPass) {
      if (response.status === 200 && response.body.token) {
        console.log(`✅ SUCCESS - Token generated`);
      } else {
        console.log(`❌ FAILED - Status ${response.status}: ${JSON.stringify(response.body)}`);
      }
    } else {
      if (response.status === 400 || response.status === 401) {
        console.log(`✅ CORRECTLY REJECTED (Status ${response.status})`);
      } else {
        console.log(`❌ FAILED - Expected rejection but got status ${response.status}: ${JSON.stringify(response.body)}`);
      }
    }
  }

  console.log('\n=== TEST COMPLETE ===');
  process.exit(0);
}

testLogin().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
