// document.addEventListener('DOMContentLoaded', async function() {
//     const authToken = localStorage.getItem('authToken');
//     if (!authToken) {
//         window.location.href = '/';
//         return;
//     }

//     // Logout functionality
//     document.getElementById('logoutBtn').addEventListener('click', function() {
//         localStorage.removeItem('authToken');
//         window.location.href = '/';
//     });

//     // Load existing accounts
//     await loadAccounts();

//     // Create account form
//     document.getElementById('createAccountForm').addEventListener('submit', async function(e) {
//         e.preventDefault();
        
//         const username = document.getElementById('newUsername').value;
//         const password = document.getElementById('newPassword').value;
//         const accountType = document.getElementById('accountType').value;
//         const messageElement = document.getElementById('createAccountMessage');
        
//         try {
//             const response = await fetch('/api/accounts', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${authToken}`
//                 },
//                 body: JSON.stringify({ username, password, accountType })
//             });
            
//             const data = await response.json();
            
//             if (response.ok) {
//                 messageElement.textContent = 'Account created successfully!';
//                 messageElement.className = 'message';
//                 document.getElementById('createAccountForm').reset();
//                 await loadAccounts();
//             } else {
//                 messageElement.textContent = data.message || 'Failed to create account';
//                 messageElement.className = 'error-message';
//             }
//         } catch (err) {
//             messageElement.textContent = 'An error occurred. Please try again.';
//             messageElement.className = 'error-message';
//             console.error('Create account error:', err);
//         }
//     });
// });

// async function loadAccounts() {
//     const authToken = localStorage.getItem('authToken');
//     const tableBody = document.getElementById('accountsTableBody');
    
//     try {
//         const response = await fetch('/api/accounts', {
//             headers: {
//                 'Authorization': `Bearer ${authToken}`
//             }
//         });
        
//         if (!response.ok) {
//             throw new Error('Failed to fetch accounts');
//         }
        
//         const accounts = await response.json();
//         tableBody.innerHTML = '';
        
//         accounts.forEach(account => {
//             const row = document.createElement('tr');
            
//             const usernameCell = document.createElement('td');
//             usernameCell.textContent = account.username;
            
//             const typeCell = document.createElement('td');
//             typeCell.textContent = account.accountType;
            
//             const actionsCell = document.createElement('td');
            
//             if (account.accountType !== 'admin') {
//                 const deleteBtn = document.createElement('button');
//                 deleteBtn.textContent = 'Delete';
//                 deleteBtn.className = 'action-btn delete-btn';
//                 deleteBtn.addEventListener('click', () => deleteAccount(account._id));
//                 actionsCell.appendChild(deleteBtn);
//             }
            
//             row.appendChild(usernameCell);
//             row.appendChild(typeCell);
//             row.appendChild(actionsCell);
            
//             tableBody.appendChild(row);
//         });
//     } catch (err) {
//         console.error('Error loading accounts:', err);
//     }
// }

// async function deleteAccount(accountId) {
//     const authToken = localStorage.getItem('authToken');
    
//     if (!confirm('Are you sure you want to delete this account?')) {
//         return;
//     }
    
//     try {
//         const response = await fetch(`/api/accounts/${accountId}`, {
//             method: 'DELETE',
//             headers: {
//                 'Authorization': `Bearer ${authToken}`
//             }
//         });
        
//         if (response.ok) {
//             await loadAccounts();
//         } else {
//             const data = await response.json();
//             alert(data.message || 'Failed to delete account');
//         }
//     } catch (err) {
//         console.error('Error deleting account:', err);
//         alert('An error occurred while deleting the account');
//     }
// }