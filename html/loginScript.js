async function loadRecentOrders() {
  const ordersTable = document.getElementById('user-orders-table');
  const ordersTableBody = document.getElementById('user-orders-table-body');
  const ordersTitle = document.querySelector('.adminFormSubTitle');
  const csrfToken = document.getElementById('csrf-token-change')?.value || '';

  try {
      const response = await fetch('http://localhost:3000/memberOrdersTable', {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'CSRF-Token': csrfToken,
          },
          credentials: 'include',
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const orders = await response.json();
      ordersTableBody.innerHTML = ''; 

      if (orders.length === 0) {
          ordersTableBody.innerHTML = '<tr><td colspan="5">No recent orders</td></tr>';
      } else {
          orders.forEach(order => {
              const row = document.createElement('tr');
              const productList = order.products
                  .map(p => `${p.name}: $${p.price.toFixed(2)} x ${p.quantity}`)
                  .join('<br>');
              row.innerHTML = `
                  <td>${order.orderId}</td>
                  <td>${productList}</td>
                  <td>$${order.total.toFixed(2)}</td>
                  <td>${order.status}</td>
                  <td>${new Date(order.date).toLocaleString()}</td>
              `;
              ordersTableBody.appendChild(row);
          });
      }

      ordersTable.classList.add('visible');
      ordersTitle.classList.add('visible');
  } catch (error) {
      console.error('Error fetching recent orders:', error);
      ordersTableBody.innerHTML = '<tr><td colspan="5">Error loading orders</td></tr>';
      ordersTable.classList.add('visible');
      ordersTitle.classList.add('visible');
  }
}

async function loadAllOrders() {
  const ordersTable = document.getElementById('orders-table');
  const ordersTableBody = document.getElementById('orders-table-body');
  const csrfToken = document.getElementById('csrf-token-change')?.value || '';

  try {
      const response = await fetch('http://localhost:3000/adminOrdersTable', {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'CSRF-Token': csrfToken,
          },
          credentials: 'include',
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const orders = await response.json();
      ordersTableBody.innerHTML = ''; 

      if (orders.length === 0) {
          ordersTableBody.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
      } else {
          orders.forEach(order => {
              const row = document.createElement('tr');
              const productList = order.products
                  .map(p => `${p.name}: $${p.price.toFixed(2)} x ${p.quantity}`)
                  .join('<br>');
              row.innerHTML = `
                  <td>${order.orderId}</td>
                  <td>${order.username}</td>
                  <td>${productList}</td>
                  <td>$${order.total.toFixed(2)}</td>
                  <td>${order.status}</td>
                  <td>${new Date(order.date).toLocaleString()}</td>
              `;
              ordersTableBody.appendChild(row);
          });
      }

      ordersTable.classList.add('visible');
  } catch (error) {
      console.error('Error fetching all orders:', error);
      ordersTableBody.innerHTML = '<tr><td colspan="6">Error loading orders</td></tr>';
      ordersTable.classList.add('visible');
  }
}

async function checkAuthStatus() {
    try {
      const response = await fetch('http://localhost:3000/check-auth', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const loginButton = document.getElementById('login-button');
      const userDisplay = document.getElementById('user-display');
      const loginForm = document.getElementById('loginForm');
      const changePasswordForm = document.getElementById('changePasswordForm');
      const ordersTable = document.getElementById('user-orders-table');
      const ordersTitle = document.querySelector('.adminFormSubTitle');
  
      if (data.authenticated) {
        if (loginForm && changePasswordForm) {
            loginForm.style.display = 'none';
            changePasswordForm.style.display = 'block';
        }
        if (data.isAdmin) {
            loginButton.innerHTML = 'Admin Panel/Logout';
            loginButton.onclick = () => window.location.href = 'admin.html';
        } else {
            await loadRecentOrders();
            loginButton.innerHTML = 'Member Panel/Logout';
            loginButton.onclick = () => window.location.href = 'login.html';
        }
        userDisplay.textContent = data.email; 

      } else {
            if (loginForm && changePasswordForm) {
                loginForm.style.display = 'block';
                changePasswordForm.style.display = 'none';
            }
            loginButton.innerHTML = '<a href="login.html">Login</a>';
            loginButton.onclick = null; 
            userDisplay.textContent = 'Guest'; 

            ordersTable.classList.remove('visible');
            ordersTitle.classList.remove('visible');
        }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const csrfToken = document.getElementById('csrf-token-login').value;
        const errorMessage = document.getElementById('login-error');
  
        try {
          const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, _csrf: csrfToken }),
            credentials: 'include',
          });
  
          const data = await response.json();
  
          if (!response.ok) {
            errorMessage.textContent = data.error || 'Invalid email or password';
            return;
          }
  
          errorMessage.textContent = '';
          await checkAuthStatus();
          if (data.isAdmin) {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'index.html';
          }
        } catch (error) {
          errorMessage.textContent = 'An error occurred. Please try again.';
          console.error('Login error:', error);
        }
      });
    }
}

function setupChangePasswordForm() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const csrfToken = document.getElementById('csrf-token-change').value;
        const errorMessage = document.getElementById('change-password-error');
  
        if (newPassword !== confirmPassword) {
          errorMessage.textContent = 'New passwords do not match';
          return;
        }
  
        try {
          const response = await fetch('http://localhost:3000/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword, _csrf: csrfToken }),
            credentials: 'include',
          });
  
          const data = await response.json();
  
          if (!response.ok) {
            errorMessage.textContent = data.error || 'Error changing password';
            return;
          }
  
          await logout(); 
        } catch (error) {
          errorMessage.textContent = 'An error occurred. Please try again.';
          console.error('Password change error:', error);
        }
      });
    }
}

async function logout() {
    try {
      await fetch('http://localhost:3000/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _csrf: document.getElementById('csrf-token-change')?.value || '' }),
        credentials: 'include',
      });
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
    }
}

window.onload = async function () {
    checkAuthStatus();
    setupLoginForm();
    setupChangePasswordForm();
    loadCart();
    loadCategories();
    if (isAdminPage) {

      const response = await fetch('http://localhost:3000/check-auth', { credentials: 'include' });
      const data = await response.json();
      if (!data.authenticated || !data.isAdmin) {
          window.location.href = 'login.html';
      } else {
          loadCategoriesEditSelect();
          loadCategoriesDeleteSelect();
          loadCategoriesAddSelect();
          loadProductsEditSelect();
          loadProductsDeleteSelect();
          await loadAllOrders();
      } 
    }
};