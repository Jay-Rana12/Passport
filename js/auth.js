
document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'https://passport-ia5r.onrender.comhttps://passport-ia5r.onrender.com/api/auth';

    // Helper functions for UI
    const showError = (msg) => {
        const errDiv = document.getElementById('error-msg');
        if (errDiv) {
            errDiv.innerText = msg;
            errDiv.style.display = 'block';
            errDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { errDiv.style.display = 'none'; }, 5000);
        }
    };

    const showSuccess = (msg) => {
        const succDiv = document.getElementById('success-msg');
        if (succDiv) {
            succDiv.innerText = msg;
            succDiv.style.display = 'block';
            succDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { succDiv.style.display = 'none'; }, 5000);
        }
    };

    const toggleLoading = (btnId, isLoading, originalText) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
        } else {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    // --- LOGIN WORKFLOW ---
    const loginForm = document.getElementById('login-form');
    const otpSection = document.getElementById('otp-section');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const backToLoginBtn = document.getElementById('back-to-login');

    let loginData = {}; // Temporary store for login credentials

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            loginData = { email, password };

            toggleLoading('login-btn', true, '<span>Continue</span> <i class="fas fa-arrow-right"></i>');

            try {
                const res = await fetch(`${apiBaseUrl}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginData)
                });

                const data = await res.json();

                if (data.otpRequired) {
                    const emailDisplay = document.getElementById('user-email');
                    if (emailDisplay) emailDisplay.innerText = data.email;

                    loginForm.style.display = 'none';
                    otpSection.style.display = 'block';

                    const otpRes = await fetch(`${apiBaseUrl}/send-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: data.email, type: 'login' })
                    });
                    const otpData = await otpRes.json();
                    let msg = 'Verification code sent to ' + data.email;
                    if (otpData.otp) msg += ' (OTP: ' + otpData.otp + ')';
                    showSuccess(msg);
                } else if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/profile';
                    }
                } else {
                    showError(data.message || 'Login failed');
                }
            } catch (err) {
                showError('Server connection error');
            } finally {
                toggleLoading('login-btn', false, '<span>Continue</span> <i class="fas fa-arrow-right"></i>');
            }
        });
    }

    // Login Resend OTP
    const resendLoginOtpBtn = document.getElementById('resend-otp');
    if (resendLoginOtpBtn && otpSection) {
        resendLoginOtpBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('user-email').innerText;
            if (!email) return showError('Email not found');

            resendLoginOtpBtn.innerText = 'Sending...';
            try {
                const res = await fetch(`${apiBaseUrl}/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, type: 'login' })
                });
                const data = await res.json();
                if (data.success) {
                    showSuccess('OTP resent to ' + email);
                } else {
                    showError(data.message);
                }
            } catch (err) {
                showError('Error resending OTP');
            } finally {
                resendLoginOtpBtn.innerText = 'Resend';
            }
        });
    }

    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            const otp = document.getElementById('otp-input').value;
            if (!otp || otp.length !== 6) {
                return showError('Please enter a valid 6-digit OTP');
            }

            toggleLoading('verify-otp-btn', true, 'Verify & Login');

            try {
                const res = await fetch(`${apiBaseUrl}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...loginData, otp })
                });

                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/profile';
                    }
                } else {
                    showError(data.message || 'OTP verification failed');
                }
            } catch (err) {
                showError('Error verifying OTP');
            } finally {
                toggleLoading('verify-otp-btn', false, 'Verify & Login');
            }
        });
    }

    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', () => {
            otpSection.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }

    // --- REGISTER WORKFLOW ---
    const registerForm = document.getElementById('register-form');
    const verifyRegisterBtn = document.getElementById('verify-register-btn');
    const backToRegisterBtn = document.getElementById('back-to-register');

    let registerData = {};

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName')?.value;
            const email = document.getElementById('email')?.value;
            const phone = document.getElementById('phone')?.value || "";
            const password = document.getElementById('password')?.value;
            registerData = { fullName, email, phone, password };

            toggleLoading('register-btn', true, '<span>Send Verification Code</span> <i class="fas fa-paper-plane"></i>');

            try {
                const res = await fetch(`${apiBaseUrl}/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, type: 'register' })
                });

                const data = await res.json();
                if (data.success) {
                    const userEmailDisplay = document.getElementById('user-email');
                    if (userEmailDisplay) userEmailDisplay.innerText = email;
                    registerForm.style.display = 'none';
                    document.getElementById('otp-section').style.display = 'block';

                    let msg = 'Verification code sent to ' + email;
                    if (data.otp) msg += ' (OTP: ' + data.otp + ')';
                    showSuccess(msg);
                } else {
                    showError(data.message);
                }
            } catch (err) {
                showError('Error sending OTP');
            } finally {
                toggleLoading('register-btn', false, '<span>Send Verification Code</span> <i class="fas fa-paper-plane"></i>');
            }
        });
    }

    if (verifyRegisterBtn) {
        verifyRegisterBtn.addEventListener('click', async () => {
            const otp = document.getElementById('otp-input').value;
            if (!otp || otp.length !== 6) {
                return showError('Please enter 6-digit OTP');
            }

            toggleLoading('verify-register-btn', true, 'Verify & Complete Signup');

            try {
                const res = await fetch(`${apiBaseUrl}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...registerData, otp })
                });

                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    showSuccess('Registration successful! Redirecting...');
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 2000);
                } else {
                    showError(data.message || 'Registration failed');
                }
            } catch (err) {
                showError('Error completing registration');
            } finally {
                toggleLoading('verify-register-btn', false, 'Verify & Complete Signup');
            }
        });
    }

    if (backToRegisterBtn) {
        backToRegisterBtn.addEventListener('click', () => {
            const registerOtpSection = document.getElementById('otp-section');
            if (registerOtpSection) registerOtpSection.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        });
    }

    // Register Resend OTP
    const resendRegisterOtpBtn = document.querySelector('#otp-section #resend-otp');
    if (resendRegisterOtpBtn) {
        resendRegisterOtpBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('user-email').innerText;
            if (!email) return;

            resendRegisterOtpBtn.innerText = 'Sending...';
            try {
                const res = await fetch(`${apiBaseUrl}/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, type: 'register' })
                });
                const data = await res.json();
                if (data.success) {
                    showSuccess('OTP resent successfully to ' + email);
                } else {
                    showError(data.message);
                }
            } catch (err) {
                showError('Error resending OTP');
            } finally {
                resendRegisterOtpBtn.innerText = 'Resend';
            }
        });
    }

    // --- FORGOT PASSWORD ---
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;

            toggleLoading('forgot-btn', true, 'Sending OTP...');

            try {
                const res = await fetch(`${apiBaseUrl}/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();
                if (data.success) {
                    showSuccess(data.message);
                    setTimeout(() => {
                        window.location.href = 'reset-password.html?email=' + email;
                    }, 2000);
                } else {
                    showError(data.message);
                }
            } catch (err) {
                showError('Something went wrong');
            } finally {
                toggleLoading('forgot-btn', false, '<span>Send Reset OTP</span> <i class="fas fa-paper-plane" style="margin-left: 8px;"></i>');
            }
        });
    }

    // --- RESET PASSWORD WORKFLOW ---
    const resetForm = document.getElementById('reset-password-form');
    // Check for email in URL to pre-fill the form
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam && document.getElementById('email')) {
        document.getElementById('email').value = emailParam;
    }

    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const otp = document.getElementById('otp').value;
            const newPassword = document.getElementById('newPassword').value;

            toggleLoading('reset-btn', true, 'Resetting Password...');

            try {
                const res = await fetch(`${apiBaseUrl}/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp, newPassword })
                });

                const data = await res.json();
                if (data.success) {
                    showSuccess('Password reset successful! Redirecting to login...');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2500);
                } else {
                    showError(data.message || 'Reset failed');
                }
            } catch (err) {
                showError('Error resetting password');
            } finally {
                toggleLoading('reset-btn', false, '<span>Reset Password</span> <i class="fas fa-check-circle" style="margin-left: 8px;"></i>');
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    const logoutLink = document.getElementById('logout-link');
    const logoutAction = () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    };

    if (logoutBtn) logoutBtn.addEventListener('click', logoutAction);
    if (logoutLink) logoutLink.addEventListener('click', (e) => { e.preventDefault(); logoutAction(); });
});
