// Error messages
const ERROR_MESSAGES = {
    // Auth errors
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/invalid-email': 'Invalid email format',
    'auth/email-already-in-use': 'Email is already registered',
    
    // Database errors
    'permission-denied': 'You do not have permission to perform this action',
    'not-found': 'The requested resource was not found',
    
    // Storage errors
    'storage/unauthorized': 'Not authorized to access storage',
    'storage/canceled': 'Upload was canceled',
    'storage/invalid-file-type': 'Invalid file type',
    
    // Default error
    'default': 'An error occurred. Please try again.'
};

// Show error message
function showError(error, container = null) {
    const message = ERROR_MESSAGES[error.code] || error.message || ERROR_MESSAGES.default;
    
    if (container) {
        // Show error in specific container
        container.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    } else {
        // Show error in toast
        showToast(message, 'error');
    }
    console.error('Error:', error);
}

// Show success message
function showSuccess(message) {
    showToast(message, 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// Create toast container if it doesn't exist
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}

// Loading spinner
function showLoading(button) {
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Loading...
    `;
    return () => {
        button.disabled = false;
        button.innerHTML = originalText;
    };
} 