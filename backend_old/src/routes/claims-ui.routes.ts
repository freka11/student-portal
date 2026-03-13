/**
 * Claims Management UI Routes
 * Provides a web interface for managing user custom claims
 */

import { Router } from 'express'
import path from 'path'
import fs from 'fs'

const router = Router()

// Serve the claims management UI
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom Claims Management</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .btn-success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
        }
        
        .search-box {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .search-box input {
            padding: 10px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            width: 250px;
            transition: border-color 0.3s ease;
        }
        
        .search-box input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .users-table {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .role-select {
            padding: 8px 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            transition: border-color 0.3s ease;
        }
        
        .role-select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .role-admin { background: #ffeaa7; }
        .role-student { background: #dfe6e9; }
        .role-teacher { background: #a29bfe; }
        .role-super_admin { background: #ff7675; color: white; }
        
        .permissions {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
        }
        
        .permission-tag {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .actions {
            display: flex;
            gap: 8px;
        }
        
        .btn-small {
            padding: 6px 12px;
            font-size: 12px;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .error {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .success {
            background: #e8f5e8;
            color: #2e7d32;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-label {
            opacity: 0.9;
        }
        
        .add-user-form {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 15px;
            align-items: end;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Custom Claims Management</h1>
            <p>Manage user roles and permissions for Firebase Authentication</p>
        </div>
        
        <div class="content">
            <div id="message"></div>
            
            <div class="stats" id="stats">
                <!-- Stats will be populated here -->
            </div>
            
            <div class="add-user-form">
                <h3>Add New User</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>User UID:</label>
                        <input type="text" id="newUid" placeholder="Enter user UID">
                    </div>
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="newEmail" placeholder="Enter email">
                    </div>
                    <div class="form-group">
                        <label>Role:</label>
                        <select id="newRole" class="role-select">
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>
                    <button class="btn btn-success" onclick="addUser()">Add User</button>
                </div>
            </div>
            
            <div class="controls">
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="Search users by email or UID...">
                    <button class="btn" onclick="searchUsers()">Search</button>
                </div>
                <div>
                    <button class="btn" onclick="loadUsers()">🔄 Refresh</button>
                    <button class="btn btn-success" onclick="saveAllChanges()">💾 Save All Changes</button>
                </div>
            </div>
            
            <div class="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>User UID</th>
                            <th>Email</th>
                            <th>Current Role</th>
                            <th>Permissions</th>
                            <th>Last Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr>
                            <td colspan="6" class="loading">Loading users...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        let users = [];
        let originalUsers = [];

        // Load users on page load
        document.addEventListener('DOMContentLoaded', loadUsers);

        async function loadUsers() {
            try {
                const response = await fetch('/api/claims-ui/users');
                const data = await response.json();
                
                if (data.success) {
                    users = data.users;
                    originalUsers = JSON.parse(JSON.stringify(users));
                    renderUsers();
                    updateStats();
                    hideMessage();
                } else {
                    showMessage('Error loading users: ' + data.message, 'error');
                }
            } catch (error) {
                showMessage('Error loading users: ' + error.message, 'error');
            }
        }

        function renderUsers(filteredUsers = null) {
            const tbody = document.getElementById('usersTableBody');
            const usersToRender = filteredUsers || users;
            
            if (usersToRender.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="loading">No users found</td></tr>';
                return;
            }
            
            tbody.innerHTML = usersToRender.map(user => \`
                <tr>
                    <td><strong>\${user.uid}</strong></td>
                    <td>\${user.email}</td>
                    <td>
                        <select class="role-select role-\${user.role}" onchange="updateRole('\${user.uid}', this.value)">
                            <option value="student" \${user.role === 'student' ? 'selected' : ''}>Student</option>
                            <option value="teacher" \${user.role === 'teacher' ? 'selected' : ''}>Teacher</option>
                            <option value="admin" \${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="super_admin" \${user.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                        </select>
                    </td>
                    <td>
                        <div class="permissions">
                            \${(user.permissions || []).map(perm => \`<span class="permission-tag">\${perm}</span>\`).join('')}
                        </div>
                    </td>
                    <td>\${user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Never'}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-small btn-success" onclick="saveUser('\${user.uid}')">Save</button>
                            <button class="btn btn-small btn-danger" onclick="removeUser('\${user.uid}')">Remove</button>
                        </div>
                    </td>
                </tr>
            \`).join('');
        }

        function updateStats() {
            const stats = {
                total: users.length,
                students: users.filter(u => u.role === 'student').length,
                teachers: users.filter(u => u.role === 'teacher').length,
                admins: users.filter(u => u.role === 'admin').length,
                superAdmins: users.filter(u => u.role === 'super_admin').length
            };
            
            document.getElementById('stats').innerHTML = \`
                <div class="stat-card">
                    <div class="stat-number">\${stats.total}</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%);">
                    <div class="stat-number">\${stats.students}</div>
                    <div class="stat-label">Students</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);">
                    <div class="stat-number">\${stats.teachers}</div>
                    <div class="stat-label">Teachers</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);">
                    <div class="stat-number">\${stats.admins}</div>
                    <div class="stat-label">Admins</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #ff7675 0%, #d63031 100%);">
                    <div class="stat-number">\${stats.superAdmins}</div>
                    <div class="stat-label">Super Admins</div>
                </div>
            \`;
        }

        function updateRole(uid, newRole) {
            const user = users.find(u => u.uid === uid);
            if (user) {
                user.role = newRole;
                user.permissions = getDefaultPermissions(newRole);
                renderUsers();
                updateStats();
            }
        }

        function getDefaultPermissions(role) {
            switch (role) {
                case 'super_admin': return ['all'];
                case 'admin': return ['read', 'write', 'delete', 'manage_content'];
                case 'teacher': return ['read', 'write', 'manage_content'];
                case 'student': return ['read', 'write'];
                default: return ['read'];
            }
        }

        async function saveUser(uid) {
            const user = users.find(u => u.uid === uid);
            if (!user) return;
            
            try {
                const response = await fetch('/api/claims-ui/set-claims', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    showMessage('User claims saved successfully!', 'success');
                    loadUsers();
                } else {
                    showMessage('Error saving user: ' + data.message, 'error');
                }
            } catch (error) {
                showMessage('Error saving user: ' + error.message, 'error');
            }
        }

        async function saveAllChanges() {
            const changedUsers = users.filter(user => {
                const original = originalUsers.find(u => u.uid === user.uid);
                return !original || original.role !== user.role;
            });
            
            if (changedUsers.length === 0) {
                showMessage('No changes to save', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/claims-ui/bulk-update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ users: changedUsers })
                });
                
                const data = await response.json();
                if (data.success) {
                    showMessage(\`Successfully saved \${changedUsers.length} user changes!\`, 'success');
                    loadUsers();
                } else {
                    showMessage('Error saving changes: ' + data.message, 'error');
                }
            } catch (error) {
                showMessage('Error saving changes: ' + error.message, 'error');
            }
        }

        async function addUser() {
            const uid = document.getElementById('newUid').value.trim();
            const email = document.getElementById('newEmail').value.trim();
            const role = document.getElementById('newRole').value;
            
            if (!uid || !email) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/claims-ui/set-claims', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid,
                        email,
                        role,
                        permissions: getDefaultPermissions(role)
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    showMessage('User added successfully!', 'success');
                    document.getElementById('newUid').value = '';
                    document.getElementById('newEmail').value = '';
                    loadUsers();
                } else {
                    showMessage('Error adding user: ' + data.message, 'error');
                }
            } catch (error) {
                showMessage('Error adding user: ' + error.message, 'error');
            }
        }

        async function removeUser(uid) {
            if (!confirm('Are you sure you want to remove this user\'s claims?')) {
                return;
            }
            
            try {
                const response = await fetch('/api/claims-ui/remove-claims', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid })
                });
                
                const data = await response.json();
                if (data.success) {
                    showMessage('User claims removed successfully!', 'success');
                    loadUsers();
                } else {
                    showMessage('Error removing user: ' + data.message, 'error');
                }
            } catch (error) {
                showMessage('Error removing user: ' + error.message, 'error');
            }
        }

        function searchUsers() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const filtered = users.filter(user => 
                user.uid.toLowerCase().includes(query) || 
                user.email.toLowerCase().includes(query)
            );
            renderUsers(filtered);
        }

        function showMessage(message, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = \`<div class="\${type}">\${message}</div>\`;
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 5000);
        }

        function hideMessage() {
            document.getElementById('message').innerHTML = '';
        }

        // Search on Enter key
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchUsers();
            }
        });
    </script>
</body>
</html>
  `)
})

// API endpoints for the UI
router.get('/users', (req, res) => {
  try {
    const claimsFile = path.join(__dirname, '../data/user-claims.json')
    if (fs.existsSync(claimsFile)) {
      const data = JSON.parse(fs.readFileSync(claimsFile, 'utf8'))
      res.json({ success: true, users: data.users || [] })
    } else {
      res.json({ success: true, users: [] })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reading users' })
  }
})

router.post('/set-claims', (req, res) => {
  try {
    const { uid, email, role, permissions } = req.body
    
    if (!uid || !email || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }
    
    const claimsFile = path.join(__dirname, '../data/user-claims.json')
    let data = { users: [] }
    
    if (fs.existsSync(claimsFile)) {
      data = JSON.parse(fs.readFileSync(claimsFile, 'utf8'))
    }
    
    const defaultPermissions: Record<string, string[]> = {
      student: ['read', 'write'],
      teacher: ['read', 'write', 'manage_content'],
      admin: ['read', 'write', 'delete', 'manage_content'],
      super_admin: ['all']
    }
    
    const userClaims = {
      uid,
      email,
      role,
      permissions: permissions || defaultPermissions[role] || ['read'],
      updatedAt: new Date().toISOString()
    }
    
    const existingIndex = data.users.findIndex((u: any) => u.uid === uid)
    if (existingIndex >= 0) {
      data.users[existingIndex] = userClaims
    } else {
      ;(data.users as any[]).push(userClaims)
    }
    
    fs.writeFileSync(claimsFile, JSON.stringify(data, null, 2))
    
    res.json({ 
      success: true, 
      message: 'User claims updated successfully',
      user: userClaims
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving claims' })
  }
})

router.post('/bulk-update', (req, res) => {
  try {
    const { users } = req.body
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, message: 'No users provided' })
    }
    
    const claimsFile = path.join(__dirname, '../data/user-claims.json')
    let data = { users: [] }
    
    if (fs.existsSync(claimsFile)) {
      data = JSON.parse(fs.readFileSync(claimsFile, 'utf8'))
    }
    
    const defaultPermissions: Record<string, string[]> = {
      student: ['read', 'write'],
      teacher: ['read', 'write', 'manage_content'],
      admin: ['read', 'write', 'delete', 'manage_content'],
      super_admin: ['all']
    }
    
    users.forEach((userClaims: any) => {
      const { uid, email, role, permissions } = userClaims
      
      const updatedClaims = {
        uid,
        email,
        role,
        permissions: permissions || defaultPermissions[role] || ['read'],
        updatedAt: new Date().toISOString()
      }
      
      const existingIndex = data.users.findIndex((u: any) => u.uid === uid)
      if (existingIndex >= 0) {
        data.users[existingIndex] = updatedClaims
      } else {
        ;(data.users as any[]).push(updatedClaims)
      }
    })
    
    fs.writeFileSync(claimsFile, JSON.stringify(data, null, 2))
    
    res.json({ 
      success: true, 
      message: `Successfully updated ${users.length} users`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating claims' })
  }
})

router.delete('/remove-claims', (req, res) => {
  try {
    const { uid } = req.body
    
    if (!uid) {
      return res.status(400).json({ success: false, message: 'UID is required' })
    }
    
    const claimsFile = path.join(__dirname, '../data/user-claims.json')
    if (!fs.existsSync(claimsFile)) {
      return res.status(404).json({ success: false, message: 'Claims file not found' })
    }
    
    const data = JSON.parse(fs.readFileSync(claimsFile, 'utf8'))
    const initialLength = data.users.length
    data.users = data.users.filter((u: any) => u.uid !== uid)
    
    fs.writeFileSync(claimsFile, JSON.stringify(data, null, 2))
    
    if (data.users.length < initialLength) {
      res.json({ success: true, message: 'User claims removed successfully' })
    } else {
      res.status(404).json({ success: false, message: 'User not found' })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing claims' })
  }
})

export function createClaimsUIRouter() {
  return router
}
