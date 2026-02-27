document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const API_BASE = 'https://passport-ia5r.onrender.com/api/profile';
    const profileForm = document.getElementById('profile-form');
    const errorMsg = document.getElementById('error-msg');
    const successMsg = document.getElementById('success-msg');
    const logoutBtn = document.getElementById('logout-btn');
    const finalSubmitBtn = document.getElementById('final-submit-btn');
    const saveDraftBtn = document.getElementById('save-draft-btn');

    let currentProfile = null;

    // Logout logic
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }

    const showSuccess = (msg) => {
        successMsg.innerText = msg;
        successMsg.style.display = 'flex';
        setTimeout(() => successMsg.style.display = 'none', 6000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const showError = (msg) => {
        errorMsg.innerText = msg;
        errorMsg.style.display = 'flex';
        setTimeout(() => errorMsg.style.display = 'none', 6000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleLoading = (btnId, isLoading, originalText) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        } else {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    const loadProfile = async () => {
        try {
            // Fetch User Basic Info
            const userRes = await fetch('https://passport-ia5r.onrender.com/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userData = await userRes.json();

            if (userData.success) {
                const name = userData.data.fullName || 'User';
                document.getElementById('sidebar-user-name').innerText = name;
                document.getElementById('fullName').value = userData.data.fullName || '';
            }

            // Fetch Profile Data
            const res = await fetch(`${API_BASE}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 404) {
                // No profile yet, show edit section by default if possible or just stay on overview with empty data
                return;
            }

            const result = await res.json();
            if (result.success && result.data) {
                currentProfile = result.data;
                populateDashboard(currentProfile);
                populateForm(currentProfile);

                // Handle Submitted State UI
                if (currentProfile.status && currentProfile.status.isSubmitted) {
                    lockForSubmission();
                }
            }
        } catch (err) {
            console.error('Error loading dashboard:', err);
            showError('Unable to load profile data. Please refresh.');
        } finally {
            // Loading overlay is handled by inline script in HTML, but we can ensure it's gone
            const overlay = document.getElementById('loading-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    };

    const populateDashboard = (data) => {
        // Hero & Sidebar
        if (data.uploads?.profilePhoto) {
            document.getElementById('sidebar-photo').src = data.uploads.profilePhoto;
        }

        const fullName = data.personalInfo?.fullName || document.getElementById('sidebar-user-name').innerText;
        document.getElementById('sidebar-user-name').innerText = fullName;
        document.getElementById('view-new-name').innerText = fullName;

        // Overview Grid
        if (data.personalInfo) {
            document.getElementById('view-new-nationality').innerText = data.personalInfo.nationality || '-';
        }

        if (data.contactInfo) {
            document.getElementById('view-new-email').innerText = data.contactInfo.email || '-';
            document.getElementById('view-new-phone').innerText = data.contactInfo.phone || '-';
        }

        if (data.passportInfo) {
            document.getElementById('view-new-passport-num').innerText = data.passportInfo.passportNumber || '-';
        }

        if (data.travelDetails) {
            document.getElementById('view-new-destination').innerText = data.travelDetails.destinationCountry || '-';
        }

        if (data.govtIdInfo) {
            document.getElementById('view-aadhaar-num').innerText = data.govtIdInfo.aadhaarNumber || '-';
            document.getElementById('view-pan-num').innerText = data.govtIdInfo.panNumber || '-';
        }

        // Signature
        if (data.uploads?.digitalSignature) {
            const sigImg = document.getElementById('view-hero-signature');
            const sigPlaceholder = document.getElementById('no-signature-placeholder');
            sigImg.src = data.uploads.digitalSignature;
            sigImg.style.display = 'block';
            if (sigPlaceholder) sigPlaceholder.style.display = 'none';
        }

        // Documents Vault
        const updateDocLink = (id, path, label) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (path) {
                el.innerHTML = `<a href="${path}" target="_blank"><i class="fas fa-eye"></i> View ${label}</a>`;
            } else {
                el.innerText = 'Not Uploaded';
            }
        };

        updateDocLink('view-new-eaadhaar-link', data.uploads?.eAadhaar, 'Aadhaar');
        updateDocLink('view-new-marksheet-link', data.uploads?.marksheet12th, 'Marksheet');
        updateDocLink('view-new-lc-link', data.uploads?.originalLc || data.uploads?.otherDoc, 'Document');

        // Status Badge
        const badge = document.getElementById('overview-badge');
        const sidebarStatus = document.getElementById('sidebar-status-pill');
        if (data.status?.isSubmitted) {
            badge.innerText = 'Submitted';
            badge.className = 'status-badge badge-submitted';
            sidebarStatus.innerText = 'Live Application';
            sidebarStatus.style.color = 'var(--success)';
        }
    };

    const populateForm = (data) => {
        if (!data) return;

        // Helper to set values
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        if (data.personalInfo) {
            setVal('fullName', data.personalInfo.fullName);
            setVal('gender', data.personalInfo.gender);
            setVal('dateOfBirth', formatDate(data.personalInfo.dateOfBirth));
            setVal('nationality', data.personalInfo.nationality);
            setVal('maritalStatus', data.personalInfo.maritalStatus);
        }

        if (data.passportInfo) {
            setVal('passportNumber', data.passportInfo.passportNumber);
            setVal('issueDate', formatDate(data.passportInfo.issueDate));
        }

        if (data.travelDetails) {
            setVal('destinationCountry', data.travelDetails.destinationCountry);
            setVal('visaType', data.travelDetails.visaType);
        }
    };

    const lockForSubmission = () => {
        // Hide Edit Nav
        const editNavItem = document.getElementById('edit-nav-item');
        if (editNavItem) editNavItem.style.display = 'none';

        // Show Banners
        const submittedBanner = document.getElementById('submitted-banner');
        if (submittedBanner) submittedBanner.style.display = 'flex';

        // Update Progress Tab
        const stepIcon = document.getElementById('step-submission-icon');
        const stepText = document.getElementById('step-submission-text');
        if (stepIcon) {
            stepIcon.style.background = 'var(--success)';
            stepIcon.innerHTML = '<i class="fas fa-check"></i>';
        }
        if (stepText) stepText.innerText = 'Your application has been received and is under review.';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    const handleSubmission = async (isFinalSubmit) => {
        if (isFinalSubmit) {
            const confirmed = confirm("PROCEED WITH CAUTION: Once you submit, your data will be LOCKED for verification. Are you sure you want to finalize?");
            if (!confirmed) return;
        }

        const btnId = isFinalSubmit ? 'final-submit-btn' : 'save-draft-btn';
        const originalText = isFinalSubmit ? 'Confirm Final Submission' : 'Save as Draft';

        toggleLoading(btnId, true, '');

        try {
            // 1. Upload Documents FIRST (Avoid race conditions with locked profile)
            const fileFields = ['profilePhoto', 'digitalSignature', 'eAadhaar', 'marksheet12th'];
            for (const field of fileFields) {
                const input = document.getElementById(field);
                if (input && input.files.length > 0) {
                    const fData = new FormData();
                    let route;
                    if (field === 'profilePhoto') {
                        route = `${API_BASE}/upload-photo`;
                        fData.append('profilePhoto', input.files[0]);
                    } else if (field === 'digitalSignature') {
                        route = `${API_BASE}/upload-signature`;
                        fData.append('digitalSignature', input.files[0]);
                    } else {
                        route = `${API_BASE}/upload-document`;
                        fData.append('fieldName', field);
                        fData.append('document', input.files[0]);
                    }

                    await fetch(route, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: fData
                    });
                }
            }

            // 2. Update Profile JSON Data
            const formData = new FormData(profileForm);
            const jsonData = {};
            formData.forEach((value, key) => {
                if (!fileFields.includes(key)) {
                    jsonData[key] = value;
                }
            });
            jsonData.isSubmitted = isFinalSubmit;

            const res = await fetch(`${API_BASE}/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(jsonData)
            });

            const result = await res.json();
            if (!result.success) throw new Error(result.message);

            showSuccess(isFinalSubmit ? 'Application successfully locked and submitted!' : 'Progress saved to cloud.');

            // Reload dashboard data
            await loadProfile();

            // Switch to overview if it was a final submit
            if (isFinalSubmit) {
                switchSection('overview');
            }

        } catch (err) {
            console.error(err);
            showError(err.message || 'Transmission error. Please try again.');
        } finally {
            toggleLoading(btnId, false, originalText);
        }
    };

    // Event Listeners
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSubmission(false); // Save draft
        });
    }

    if (finalSubmitBtn) {
        finalSubmitBtn.addEventListener('click', () => {
            handleSubmission(true); // Final submit
        });
    }

    // Initial Load
    loadProfile();
});

