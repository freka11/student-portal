/**
 * Test script to verify authentication fixes
 */

const http = require('http')
const fs = require('fs')

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
async function testDevTokenAuth() {
  console.log('🔍 Testing Development Token Authentication...')
  
  const adminToken = 'dev_token_rahul123'
  const headers = { 'Authorization': `Bearer ${adminToken}` }
  
  try {
    // Test admin endpoint with dev token
    const response = await makeRequest('/api/admin/questions', 'GET', headers)
    console.log(`Admin Questions Status: ${response.status}`)
    
    if (response.status === 200) {
      console.log('✅ Development token authentication working')
      return true
    } else {
      console.log('❌ Development token authentication failed')
      console.log('Response:', response.body)
      return false
    }
  } catch (error) {
    console.log('❌ Dev token test failed:', error.message)
    return false
  }
}

async function testFirebaseTokenWithLocalClaims() {
  console.log('\n🔍 Testing Firebase Token with Local Claims...')
  
  // Create a mock Firebase token for rahul123
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
      console.log('✅ Firebase token with local claims working')
      return true
    } else {
      console.log('❌ Firebase token with local claims failed')
      console.log('Response:', response.body)
      return false
    }
  } catch (error) {
    console.log('❌ Firebase token test failed:', error.message)
    return false
  }
}

async function testThoughtDeletion() {
  console.log('\n🔍 Testing Thought Deletion...')
  
  const adminToken = 'dev_token_rahul123'
  const headers = { 'Authorization': `Bearer ${adminToken}` }
  
  try {
    // First, create a test thought
    const createResponse = await makeRequest('/api/admin/thoughts', 'POST', headers, {
      thought: 'Test thought for deletion'
    })
    console.log(`Create Thought Status: ${createResponse.status}`)
    
    if (createResponse.status === 200) {
      const createdThought = JSON.parse(createResponse.body)
      const thoughtId = createdThought.id || 'test-id'
      
      // Now delete it
      const deleteResponse = await makeRequest(`/api/admin/thoughts/${thoughtId}`, 'DELETE', headers)
      console.log(`Delete Thought Status: ${deleteResponse.status}`)
      
      if (deleteResponse.status === 200) {
        console.log('✅ Thought deletion working')
        return true
      } else {
        console.log('❌ Thought deletion failed')
        console.log('Response:', deleteResponse.body)
        return false
      }
    } else {
      console.log('❌ Failed to create test thought')
      console.log('Response:', createResponse.body)
      return false
    }
  } catch (error) {
    console.log('❌ Thought deletion test failed:', error.message)
    return false
  }
}

async function testClaimsUI() {
  console.log('\n🔍 Testing Claims UI...')
  
  try {
    const response = await makeRequest('/api/claims-ui/')
    console.log(`Claims UI Status: ${response.status}`)
    
    if (response.status === 200 && response.body.includes('Custom Claims Management')) {
      console.log('✅ Claims UI working')
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
    
    if (getUsersResponse.status === 200) {
      const users = JSON.parse(getUsersResponse.body)
      console.log(`Found ${users.users?.length || 0} users in claims system`)
      
      // Check if our test user exists
      const rahulUser = users.users?.find(u => u.uid === 'rahul123')
      if (rahulUser && rahulUser.role === 'admin') {
        console.log('✅ Admin user found in claims system')
        return true
      } else {
        console.log('❌ Admin user not found or wrong role')
        return false
      }
    } else {
      console.log('❌ Failed to get users from claims API')
      return false
    }
  } catch (error) {
    console.log('❌ Claims API test failed:', error.message)
    return false
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Authentication Tests...\n')
  
  const results = {
    devTokenAuth: await testDevTokenAuth(),
    firebaseTokenWithLocalClaims: await testFirebaseTokenWithLocalClaims(),
    thoughtDeletion: await testThoughtDeletion(),
    claimsUI: await testClaimsUI(),
    claimsAPI: await testClaimsAPI()
  }
  
  console.log('\n📊 Test Results:')
  console.log('================')
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${test.padEnd(25)}: ${status}`)
  })
  
  const passedTests = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log(`\n🎯 Summary: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Authentication fixes are working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.')
  }
  
  return results
}

// Run tests
runAllTests().catch(console.error)
