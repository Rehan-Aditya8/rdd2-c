// Verification Screen JavaScript

// Dummy report data for verification
const verificationReportData = {
    id: 'RPT-002',
    location: 'Park Avenue, Near School',
    address: 'Park Avenue, Block 7, Near City School, New Delhi',
    coordinates: {
        lat: 28.6139,
        lng: 77.2090
    },
    date: '2024-01-14',
    time: '3:45 PM',
    image: 'https://via.placeholder.com/800x600/764ba2/ffffff?text=Damage+Photo',
    aiResults: {
        damageType: 'Pothole',
        severity: 'Medium',
        confidence: '87%',
        estimatedSize: '2.5m x 1.8m',
        depth: '15-20cm'
    },
    reporter: {
        name: 'Citizen User',
        contact: 'user@example.com'
    }
};

/**
 * Initialize verification page
 */
function initVerification() {
    // Check if report ID is in sessionStorage
    const reportId = sessionStorage.getItem('selectedReportId');
    if (reportId) {
        // In a real app, fetch report data by ID
        // For now, use dummy data
        loadReportData(verificationReportData);
    } else {
        // Load default report
        loadReportData(verificationReportData);
    }
}

/**
 * Load report data
 */
function loadReportData(report) {
    // Set report image
    document.getElementById('reportImage').src = report.image;
    
    // Set AI results
    const aiResult = document.getElementById('aiResult');
    aiResult.innerHTML = `
        <div class="ai-result-item">
            <strong>Damage Type:</strong> ${report.aiResults.damageType}
        </div>
        <div class="ai-result-item">
            <strong>Severity:</strong> ${report.aiResults.severity}
        </div>
        <div class="ai-result-item">
            <strong>Confidence:</strong> ${report.aiResults.confidence}
        </div>
        <div class="ai-result-item">
            <strong>Estimated Size:</strong> ${report.aiResults.estimatedSize}
        </div>
        <div class="ai-result-item">
            <strong>Depth:</strong> ${report.aiResults.depth}
        </div>
    `;
    
    // Set map coordinates
    document.getElementById('mapCoords').textContent = 
        `${report.coordinates.lat}, ${report.coordinates.lng}`;
    
    // Set report info
    const reportInfo = document.getElementById('reportInfo');
    reportInfo.innerHTML = `
        <div class="report-info-item">
            <strong>Report ID:</strong> ${report.id}
        </div>
        <div class="report-info-item">
            <strong>Location:</strong> ${report.location}
        </div>
        <div class="report-info-item">
            <strong>Full Address:</strong> ${report.address}
        </div>
        <div class="report-info-item">
            <strong>Date & Time:</strong> ${report.date} at ${report.time}
        </div>
        <div class="report-info-item">
            <strong>Reporter:</strong> ${report.reporter.name}
        </div>
        <div class="report-info-item">
            <strong>Contact:</strong> ${report.reporter.contact}
        </div>
    `;
}

/**
 * Approve report
 */
function approveReport() {
    const reason = document.getElementById('reasonInput').value.trim();
    
    if (!reason) {
        showAlert('Reason Required', 'Please provide a reason for approval.', 'warning');
        return;
    }
    
    const reportId = verificationReportData.id;
    
    // In a real app, send approval to backend
    showAlert('Report Approved', `Report ${reportId} has been approved.\n\nReason: ${reason}\n\nRedirecting to dashboard...`, 'success', () => {
        // Clear session storage
        sessionStorage.removeItem('selectedReportId');
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    });
}

/**
 * Reject report
 */
function rejectReport() {
    const reason = document.getElementById('reasonInput').value.trim();
    
    if (!reason) {
        showAlert('Reason Required', 'Please provide a reason for rejection.', 'warning');
        return;
    }
    
    const reportId = verificationReportData.id;
    
    // In a real app, send rejection to backend
    showConfirm('Confirm Rejection', `Are you sure you want to reject report ${reportId}?\n\nReason: ${reason}`, () => {
        showAlert('Report Rejected', `Report ${reportId} has been rejected.\n\nRedirecting to dashboard...`, 'error', () => {
            // Clear session storage
            sessionStorage.removeItem('selectedReportId');
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        });
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initVerification);
