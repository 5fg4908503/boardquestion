// Check if user is already logged in
firebase.auth().onAuthStateChanged((user) => {
    // Get current page
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
        // If logged in and on login page, redirect to dashboard
        if (currentPage === 'admin-login.html') {
            window.location.href = 'admin-dashboard.html';
        }
    } else {
        // If not logged in and trying to access dashboard, redirect to login
        if (currentPage === 'admin-dashboard.html') {
            window.location.href = 'admin-login.html';
        }
    }
});

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        window.location.href = 'admin-dashboard.html';
    } catch (error) {
        showError(error);
    }
}); 