/**
 * Test script to verify all backend fixes
 */

const http = require('http')

// Test configuration
const BASE_URL = 'http://localhost:4000'

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        })
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    if (body) {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

// Test functions
async function testBackendHealth() {
  console.log('🔍 Testing Backend Health...')
  try {
    const response = await makeRequest('/')
    console.log(`Status: ${response.status}`)
    if (response.status === 200) {
      console.log('✅ Backend is running')
      return true
    } else {
      console.log('❌ Backend not responding correctly')
      return false
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message)
    return false
  }
}

async function testClaimsUI() {
  console.log('\n🔍 Testing Claims UI...')
  try {
    const response = await makeRequest('/api/claims-ui/')
    console.log(`Status: ${response.status}`)
    if (response.status === 200 && response.body.includes('Custom Claims Management')) {
      console.log('✅ Claims UI is working')
      return true
    } else {
      console.log('❌ Claims UI not working')
      return false
    }
  } catch (error) {
    console.log('❌ Claims UI test failed:', error.message)
    return false
  }
}

async function testClaimsAPI() {
  console.log('\n🔍 Testing Claims API...')
  try {
    // Test getting users
    const getUsersResponse = await makeRequest('/api/claims-ui/users')
    console.log(`Get Users Status: ${getUsersResponse.status}`)
    
    // Test setting claims
    const setClaimsResponse = await makeRequest('/api/claims-ui/set-claims', 'POST', {}, {
      uid: 'test-user-123',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_content']
    })
    console.log(`Set Claims Status: ${setClaimsResponse.status}`)
    
    if (getUsersResponse.status === 200 && setClaimsResponse.status === 200) {
      console.log('✅ Claims API is working')
      return true
    } else {
      console.log('❌ Claims API not working')
      return false
    }
  } catch (error) {
    console.log('❌ Claims API test failed:', error.message)
    return false
  }
}

async function testAdminEndpoints() {
  console.log('\n🔍 Testing Admin Endpoints...')
  
  // Test with development token
  const adminToken = 'dev_token_rahul123'
  const headers = { 'Authorization': `Bearer ${adminToken}` }
  
  try {
    const response = await makeRequest('/api/admin/questions', 'GET', headers)
    console.log(`Admin Questions Status: ${response.status}`)
    
    if (response.status === 200) {
      console.log('✅ Admin endpoints working with dev token')
      return true
    } else if (response.status === 401) {
      console.log('⚠️ Admin endpoints require proper authentication')
      return false
    } else {
      console.log('❌ Admin endpoints not working')
      return false
    }
  } catch (error) {
    console.log('❌ Admin endpoints test failed:', error.message)
    return false
  }
}

async function testFirebaseTokenHandling() {
  console.log('\n🔍 Testing Firebase Token Handling...')
  
  // Create a mock Firebase token
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    uid: 'rahul123',
    email: 'rahul@example.com',
    role: 'student', // This should be overridden by local claims
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url')
  const signature = 'mock-signature'
  
  const firebaseToken = `${header}.${payload}.${signature}`
  const headers = { 'Authorization': `Bearer ${firebaseToken}` }
  
  try {
    const response = await makeRequest('/api/admin/questions', 'GET', headers)
    console.log(`Firebase Token Status: ${response.status}`)
    
    if (response.status === 200) {
      console.log('✅ Firebase token handling working with local claims')
      return true
    } else if (response.status === 401) {
      console.log('⚠️ Firebase token not recognized - may need local claims setup')
      return false
    } else {
      console.log('❌ Firebase token handling not working')
      return false
    }
  } catch (error) {
    console.log('❌ Firebase token test failed:', error.message)
    return false
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Backend Tests...\n')
  
  const results = {
    backendHealth: await testBackendHealth(),
    claimsUI: await testClaimsUI(),
    claimsAPI: await testClaimsAPI(),
    adminEndpoints: await testAdminEndpoints(),
    firebaseTokenHandling: await testFirebaseTokenHandling()
  }
  
  console.log('\n📊 Test Results:')
  console.log('================')
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${test.padEnd(20)}: ${status}`)
  })
  
  const passedTests = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log(`\n🎯 Summary: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Backend is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.')
  }
  
  return results
}

// Run tests
runAllTests().catch(console.error)
