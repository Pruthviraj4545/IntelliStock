const http = require('http');

function makeRequest(method, path, body = null, token = null) {
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

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, body: response, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
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

async function runTests() {
  console.log('=== FILTER VALIDATION TEST SUITE ===\n');

  // Step 1: Login to get token
  console.log('[STEP 1] Logging in...');
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'password123'
  });

  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.error('❌ Login failed:', loginRes.body);
    process.exit(1);
  }

  const token = loginRes.body.token;
  console.log('✅ Login successful, got token');

  // Test cases
  const tests = [
    { name: 'Empty Filter', query: '' },
    { name: 'Text Search', query: 'query=laptop' },
    { name: 'Single Category', query: 'category=Electronics' },
    { name: 'Multiple Categories', query: 'category=Electronics&category=Computers' },
    { name: 'Price Range (Valid)', query: 'minPrice=100&maxPrice=500' },
    { name: 'Price Range (Invalid - negative)', query: 'minPrice=-100&maxPrice=500' },
    { name: 'Pagination (Valid)', query: 'page=1&limit=10' },
    { name: 'Pagination (Invalid - page 0)', query: 'page=0&limit=10' },
    { name: 'Sorting', query: 'sortBy=name&sortOrder=asc' },
    { name: 'Invalid Sort Order', query: 'sortBy=name&sortOrder=invalid' },
    { name: 'Complex Query', query: 'query=phone&category=Electronics&minPrice=200&maxPrice=1000&page=1&limit=20&sortBy=selling_price&sortOrder=desc' }
  ];

  console.log('\n[STEP 2] Running filter tests...\n');

  for (const test of tests) {
    process.stdout.write(`Testing "${test.name}"... `);
    const response = await makeRequest('GET', `/api/products/filter?${test.query}`, null, token);
    
    if (response.status === 200) {
      console.log(`✅ PASS (${response.body.products?.length || 0} results)`);
    } else if (response.status === 400) {
      console.log(`⚠️  VALIDATION FAILED`);
      if (response.body.errors) {
        console.log(`   Errors:`, response.body.errors.map(e => `${e.field}: ${e.message}`).join(', '));
      }
    } else {
      console.log(`❌ ERROR (Status ${response.status})`);
      if (response.body.message) {
        console.log(`   Message:`, response.body.message);
      }
    }
  }

  console.log('\n=== TEST SUITE COMPLETE ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
