// Report Damage Screen JavaScript

// Dummy GPS location data
const dummyLocation = {
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'Connaught Place, New Delhi, Delhi 110001, India'
};

/**
 * Initialize the report damage form
 */
function initReportForm() {
    // Set dummy GPS location
    const locationDisplay = document.getElementById('locationDisplay');
    locationDisplay.textContent = `${dummyLocation.address} (${dummyLocation.latitude}, ${dummyLocation.longitude})`;
    
    // Set current timestamp
    const timestampDisplay = document.getElementById('timestampDisplay');
    const now = new Date();
    timestampDisplay.textContent = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Setup upload area click
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('click', () => {
        if (!document.getElementById('imagePreview').style.display || 
            document.getElementById('imagePreview').style.display === 'none') {
            triggerFileInput();
        }
    });
}

/**
 * Trigger file input
 */
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

/**
 * Handle file selection
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            
            // Hide placeholder, show actions
            document.getElementById('uploadPlaceholder').style.display = 'none';
            document.getElementById('uploadActions').style.display = 'block';
            
            // Enable submit button
            document.getElementById('submitBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Retake/Reupload photo
 */
function retakePhoto() {
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('uploadActions').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('submitBtn').disabled = true;
}

/**
 * Submit report
 */
function submitReport() {
    const description = document.getElementById('descriptionInput').value;
    const hasImage = document.getElementById('imagePreview').style.display !== 'none';
    
    if (!hasImage) {
        showAlert('Upload Required', 'Please upload a damage photo first.', 'warning');
        return;
    }
    
    // Generate dummy report ID
    const reportId = 'RPT-' + Date.now().toString().slice(-6);
    
    // Store report data (in real app, this would go to backend)
    const reportData = {
        id: reportId,
        location: dummyLocation,
        timestamp: new Date().toISOString(),
        description: description,
        status: 'reported'
    };
    
    // Show success message
    showAlert('Report Submitted', `Report submitted successfully!\n\nReport ID: ${reportId}\n\nYou will be redirected to the tracking page.`, 'success', () => {
        // Redirect to tracking page
        sessionStorage.setItem('selectedReportId', reportId);
        window.location.href = 'tracking.html';
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initReportForm);
