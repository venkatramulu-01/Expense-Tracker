// Global variables to store signup data
let signupData = {};
let currentCaptcha = '';
let mathAnswer = 0;

// Form switching functionality
function switchToSignup() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('active');
    document.getElementById('securityForm').classList.remove('active');
    document.getElementById('otpForm').classList.remove('active');
    generateCaptcha();
    clearMessages();
}

function switchToLogin() {
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('securityForm').classList.remove('active');
    document.getElementById('otpForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
    clearMessages();
}

function showSecurityForm() {
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('securityForm').classList.add('active');
    clearMessages();
}

function showOTPForm() {
    document.getElementById('securityForm').classList.remove('active');
    document.getElementById('otpForm').classList.add('active');
    document.getElementById('otpEmail').textContent = signupData.email;
    clearMessages();
}

function backToSignup() {
    document.getElementById('securityForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('active');
}

function backToSecurity() {
    document.getElementById('otpForm').classList.remove('active');
    document.getElementById('securityForm').classList.add('active');
}

// Message functions
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type} show`;
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 5000);
}

function clearMessages() {
    const messageDiv = document.getElementById('message');
    messageDiv.classList.remove('show');
}

// Enhanced Captcha functions
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    currentCaptcha = '';
    
    // Generate 5-character captcha
    for (let i = 0; i < 5; i++) {
        currentCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Display captcha with some styling effects
    const captchaElement = document.getElementById('captchaText');
    if (captchaElement) {
        captchaElement.textContent = currentCaptcha;
        console.log('🔤 Generated Captcha:', currentCaptcha); // Debug line
    } else {
        console.error('❌ Captcha element not found!');
    }
}

// Initialize captcha when page loads
window.addEventListener('load', () => {
    console.log('🚀 Page loaded, generating captcha...');
    generateCaptcha();
});

// Refresh captcha button event
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshCaptcha');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            generateCaptcha();
            document.getElementById('captchaInput').value = ''; // Clear input
            console.log('🔄 Captcha refreshed');
        });
    }
});

// OTP input functionality
document.querySelectorAll('.otp-input').forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1) {
            const nextInput = document.querySelectorAll('.otp-input')[index + 1];
            if (nextInput) nextInput.focus();
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '') {
            const prevInput = document.querySelectorAll('.otp-input')[index - 1];
            if (prevInput) prevInput.focus();
        }
    });
});

// Enhanced validation functions
function validateEmail(email) {
    const re = /^[^\s@]+@gmail\.com$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateMobile(mobile) {
    const re = /^[6-9]\d{9}$/;
    return re.test(mobile);
}

function validateUsername(username) {
    const re = /^[a-zA-Z0-9_]{3,20}$/;
    return re.test(username);
}

function validateName(name) {
    return name.trim().length >= 2;
}

// Loading state management
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.textContent = 'Please wait...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText;
    }
}

// Step 1: Enhanced signup form submission
document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.dataset.originalText = submitBtn.textContent;
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const mobile = document.getElementById('signupMobile').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const captchaInput = document.getElementById('captchaInput').value;
    
    // Enhanced validation
    if (!validateName(name)) {
        showMessage('Please enter a valid name (at least 2 characters)', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid Gmail address', 'error');
        return;
    }
    
    if (!validateUsername(username)) {
        showMessage('Username must be 3-20 characters (letters, numbers, underscore only)', 'error');
        return;
    }
    
    if (!validateMobile(mobile)) {
        showMessage('Please enter a valid 10-digit Indian mobile number', 'error');
        return;
    }
    
    if (!validatePassword(password)) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (captchaInput.toUpperCase() !== currentCaptcha.toUpperCase()) {
        showMessage('Incorrect captcha. Please try again.', 'error');
        generateCaptcha();
        document.getElementById('captchaInput').value = '';
        return;
    }
    
    // Store data and proceed to step 2
    signupData = { name, email, username, mobile, password };
    showMessage('Basic information validated! Please set up security questions.', 'success');
    setTimeout(() => showSecurityForm(), 1500);
});

// Step 2: Security questions form submission
document.getElementById('securityFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const question1 = document.getElementById('question1').value;
    const answer1 = document.getElementById('answer1').value.trim();
    const question2 = document.getElementById('question2').value;
    const answer2 = document.getElementById('answer2').value.trim();
    
    if (!question1 || !answer1 || !question2 || !answer2) {
        showMessage('Please answer both security questions', 'error');
        return;
    }
    
    if (question1 === question2) {
        showMessage('Please select different security questions', 'error');
        return;
    }
    
    // Store security data
    signupData.securityQuestions = [
        { question: question1, answer: answer1.toLowerCase() },
        { question: question2, answer: answer2.toLowerCase() }
    ];
    
    // Send OTP
    try {
        showMessage('Sending OTP to your email...', 'success');
        
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: signupData.email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('OTP sent to your email! Please check your inbox.', 'success');
            setTimeout(() => showOTPForm(), 1500);
        } else {
            showMessage(data.message || 'Failed to send OTP', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
        console.error('❌ Send OTP error:', error);
    }
});

// Step 3: OTP verification and final signup
document.getElementById('otpFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showMessage('Please enter the complete 6-digit OTP', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';
    
    try {
        console.log('🔐 Verifying signup with OTP...');
        
        const response = await fetch('/api/verify-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...signupData,
                otp: otp
            })
        });
        
        const data = await response.json();
        console.log('📨 Verification response:', data);
        
        if (data.success) {
            showMessage('🎉 Account created successfully! Please login.', 'success');
            
            // Clear OTP inputs
            otpInputs.forEach(input => input.value = '');
            
            // Switch to login form after 2 seconds
            setTimeout(() => {
                switchToLogin();
                document.getElementById('loginEmail').value = signupData.email;
            }, 2000);
            
        } else {
            showMessage(data.message || 'Verification failed', 'error');
        }
        
    } catch (error) {
        console.error('❌ Verification error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Verify & Complete Registration';
    }
});

// Resend OTP function
async function resendOTP() {
    try {
        showMessage('Sending new OTP...', 'success');
        
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: signupData.email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('New OTP sent to your email!', 'success');
            
            // Clear OTP inputs
            document.querySelectorAll('.otp-input').forEach(input => input.value = '');
            document.querySelector('.otp-input').focus();
        } else {
            showMessage('Failed to resend OTP', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

// Enhanced Login form submission
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.dataset.originalText = submitBtn.textContent;
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Client-side validation
    if (!email) {
        showMessage('Please enter your email or username', 'error');
        return;
    }
    
    if (!validatePassword(password)) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Show loading state
    setButtonLoading(submitBtn, true);
    
    try {
        console.log('🚀 Sending login request...');
        
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        console.log('📨 Server response:', data);
        
        if (data.success) {
            showMessage(data.message, 'success');
            
            // Store token in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
            
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// Test server connection on page load
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/api/test');
        const data = await response.json();
        console.log('✅ Server connection test:', data.message);
    } catch (error) {
        console.error('❌ Server connection failed:', error);
        showMessage('Unable to connect to server. Please refresh the page.', 'error');
    }
});
