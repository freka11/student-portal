/**
 * Test script to verify local claims work with Firebase-like tokens
 */

// Create a mock JWT payload for our test users
function createMockToken(uid, email, role = 'student') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    uid: uid,
    email: email,
    role: role, // This will be ignored in favor of local claims
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url')
  const signature = 'mock-signature'
  
  return `${header}.${payload}.${signature}`
}

// Test admin user
const adminToken = createMockToken('rahul123', 'rahul@example.com', 'student') // Role in token is 'student' but local claims say 'admin'
const studentToken = createMockToken('likhith456', 'likhith@example.com', 'student')

console.log('🧪 Testing Local Claims System')
console.log('\n📝 Admin Test:')
console.log('Token:', adminToken)
console.log('Expected: Admin role from local claims')

console.log('\n📝 Student Test:')
console.log('Token:', studentToken)
console.log('Expected: Student role from local claims')

// Test with fetch
async function testToken(token, description) {
  console.log(`\n🔍 Testing ${description}:`)
  try {
    const response = await fetch('http://localhost:4000/api/admin/questions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const result = await response.text()
    console.log(`Status: ${response.status}`)
    console.log(`Response: ${result.substring(0, 100)}...`)
    
    if (response.status === 200) {
      console.log('✅ SUCCESS - Admin access granted')
    } else if (response.status === 401) {
      console.log('❌ FAILED - Unauthorized')
    } else if (response.status === 403) {
      console.log('⛔ EXPECTED - Forbidden (student trying to access admin)')
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
  }
}

// Run tests
async function runTests() {
  await testToken(adminToken, 'Admin User (rahul123)')
  await testToken(studentToken, 'Student User (likhith456)')
  
  console.log('\n🎯 Test Summary:')
  console.log('- Admin should get 200 OK (access granted)')
  console.log('- Student should get 403 Forbidden (access denied)')
}

runTests().catch(console.error)
