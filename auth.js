/* ============================================
   AXION - Authentication JavaScript
   ============================================ */

// Wait for DOM and AXION to be ready
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

function initAuth() {
    // Redirect if already logged in
    if (window.AXION.auth.isLoggedIn() && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Check if on login or register page
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        initLoginForm(loginForm);
    }

    if (registerForm) {
        initRegisterForm(registerForm);
    }
}

function initLoginForm(form) {
    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const rememberMe = form.querySelector('input[name="remember"]');
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorAlert = form.querySelector('.alert-error');
    const successAlert = form.querySelector('.alert-success');

    // Clear any previous session on login page
    if (!window.AXION.auth.isLoggedIn()) {
        // This is fine, proceed with login
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide any previous alerts
        if (errorAlert) errorAlert.classList.remove('show');
        if (successAlert) successAlert.classList.remove('show');

        // Validate inputs
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Clear previous errors
        clearErrors(form);

        let hasError = false;

        if (!email) {
            showError(emailInput, 'Email is required');
            hasError = true;
        } else if (!window.AXION.auth.validateEmail(email)) {
            showError(emailInput, 'Please enter a valid email');
            hasError = true;
        }

        if (!password) {
            showError(passwordInput, 'Password is required');
            hasError = true;
        }

        if (hasError) return;

        // Show loading state
        setLoading(submitBtn, true);

        try {
            const user = await window.AXION.auth.login(email, password, rememberMe?.checked);
            
            if (successAlert) {
                successAlert.textContent = 'Login successful! Redirecting...';
                successAlert.classList.add('show');
            }

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            if (errorAlert) {
                errorAlert.textContent = error.message || 'Login failed. Please try again.';
                errorAlert.classList.add('show');
            }
        } finally {
            setLoading(submitBtn, false);
        }
    });

    // Real-time validation
    emailInput?.addEventListener('blur', () => {
        if (emailInput.value && !window.AXION.auth.validateEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email');
        } else {
            clearError(emailInput);
        }
    });

    passwordInput?.addEventListener('blur', () => {
        if (passwordInput.value && passwordInput.value.length < 1) {
            clearError(passwordInput);
        }
    });
}

function initRegisterForm(form) {
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorAlert = form.querySelector('.alert-error');
    const successAlert = form.querySelector('.alert-success');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide any previous alerts
        if (errorAlert) errorAlert.classList.remove('show');
        if (successAlert) successAlert.classList.remove('show');

        // Validate inputs
        const name = nameInput?.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput?.value;

        // Clear previous errors
        clearErrors(form);

        let hasError = false;

        if (nameInput && !name) {
            showError(nameInput, 'Name is required');
            hasError = true;
        }

        if (!email) {
            showError(emailInput, 'Email is required');
            hasError = true;
        } else if (!window.AXION.auth.validateEmail(email)) {
            showError(emailInput, 'Please enter a valid email');
            hasError = true;
        }

        if (!password) {
            showError(passwordInput, 'Password is required');
            hasError = true;
        } else if (password.length < 6) {
            showError(passwordInput, 'Password must be at least 6 characters');
            hasError = true;
        }

        if (confirmPasswordInput && password !== confirmPassword) {
            showError(confirmPasswordInput, 'Passwords do not match');
            hasError = true;
        }

        if (hasError) return;

        // Show loading state
        setLoading(submitBtn, true);

        try {
            // In a real app, this would call an API
            // For demo, we'll just simulate registration
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Auto-login after registration
            const user = await window.AXION.auth.login(email, password);

            if (successAlert) {
                successAlert.textContent = 'Account created successfully! Redirecting...';
                successAlert.classList.add('show');
            }

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            if (errorAlert) {
                errorAlert.textContent = error.message || 'Registration failed. Please try again.';
                errorAlert.classList.add('show');
            }
        } finally {
            setLoading(submitBtn, false);
        }
    });

    // Real-time validation
    nameInput?.addEventListener('blur', () => {
        if (nameInput.value && nameInput.value.length < 2) {
            showError(nameInput, 'Name must be at least 2 characters');
        } else {
            clearError(nameInput);
        }
    });

    emailInput?.addEventListener('blur', () => {
        if (emailInput.value && !window.AXION.auth.validateEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email');
        } else {
            clearError(emailInput);
        }
    });

    passwordInput?.addEventListener('blur', () => {
        if (passwordInput.value && passwordInput.value.length < 6) {
            showError(passwordInput, 'Password must be at least 6 characters');
        } else {
            clearError(passwordInput);
        }
    });

    confirmPasswordInput?.addEventListener('blur', () => {
        if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
            showError(confirmPasswordInput, 'Passwords do not match');
        } else {
            clearError(confirmPasswordInput);
        }
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function showError(input, message) {
    input.classList.add('error');
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup?.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearError(input) {
    input.classList.remove('error');
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup?.querySelector('.error-message');
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

function clearErrors(form) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => clearError(input));
}

function setLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}
