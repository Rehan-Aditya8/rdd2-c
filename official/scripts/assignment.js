// Assignment Screen JavaScript

// Dummy contractors data
const contractorsData = [
    { id: 'CONT-001', name: 'ABC Road Construction Co.', specialization: 'Pothole Repair', rating: 4.5 },
    { id: 'CONT-002', name: 'XYZ Infrastructure Ltd.', specialization: 'Road Resurfacing', rating: 4.8 },
    { id: 'CONT-003', name: 'City Builders Inc.', specialization: 'General Road Maintenance', rating: 4.2 },
    { id: 'CONT-004', name: 'QuickFix Contractors', specialization: 'Emergency Repairs', rating: 4.6 }
];

// Dummy report data
const assignmentReportData = {
    id: 'RPT-004',
    location: 'Oak Street, Intersection',
    address: 'Oak Street, Intersection with Main Road, Block 3',
    severity: 'Low',
    damageType: 'Cracked Road Surface',
    date: '2024-01-12',
    estimatedCost: '₹15,000',
    estimatedTime: '2-3 days'
};

/**
 * Initialize assignment page
 */
function initAssignment() {
    // Check if report ID is in sessionStorage
    const reportId = sessionStorage.getItem('selectedReportId');
    if (reportId) {
        // In a real app, fetch report data by ID
        // For now, use dummy data
        loadReportDetails(assignmentReportData);
    } else {
        loadReportDetails(assignmentReportData);
    }
    
    // Populate contractors dropdown
    populateContractors();
    
    // Set default completion date (7 days from now)
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    document.getElementById('completionDate').valueAsDate = defaultDate;
    
    // Update work order preview on change
    document.getElementById('contractorSelect').addEventListener('change', updateWorkOrderPreview);
    document.getElementById('prioritySelect').addEventListener('change', updateWorkOrderPreview);
    document.getElementById('completionDate').addEventListener('change', updateWorkOrderPreview);
    document.getElementById('instructionsInput').addEventListener('input', updateWorkOrderPreview);
    
    // Initial preview
    updateWorkOrderPreview();
}

/**
 * Load report details
 */
function loadReportDetails(report) {
    const detailsContainer = document.getElementById('reportDetails');
    detailsContainer.innerHTML = `
        <div class="report-detail-row">
            <strong>Report ID:</strong>
            <span>${report.id}</span>
        </div>
        <div class="report-detail-row">
            <strong>Location:</strong>
            <span>${report.location}</span>
        </div>
        <div class="report-detail-row">
            <strong>Full Address:</strong>
            <span>${report.address}</span>
        </div>
        <div class="report-detail-row">
            <strong>Severity:</strong>
            <span>${report.severity}</span>
        </div>
        <div class="report-detail-row">
            <strong>Damage Type:</strong>
            <span>${report.damageType}</span>
        </div>
        <div class="report-detail-row">
            <strong>Report Date:</strong>
            <span>${report.date}</span>
        </div>
        <div class="report-detail-row">
            <strong>Estimated Cost:</strong>
            <span>${report.estimatedCost}</span>
        </div>
        <div class="report-detail-row">
            <strong>Estimated Time:</strong>
            <span>${report.estimatedTime}</span>
        </div>
    `;
}

/**
 * Populate contractors dropdown
 */
function populateContractors() {
    const select = document.getElementById('contractorSelect');
    contractorsData.forEach(contractor => {
        const option = document.createElement('option');
        option.value = contractor.id;
        option.textContent = `${contractor.name} (${contractor.specialization}) - ⭐ ${contractor.rating}`;
        select.appendChild(option);
    });
}

/**
 * Update work order preview
 */
function updateWorkOrderPreview() {
    const contractorId = document.getElementById('contractorSelect').value;
    const priority = document.getElementById('prioritySelect').value;
    const completionDate = document.getElementById('completionDate').value;
    const instructions = document.getElementById('instructionsInput').value;
    
    const contractor = contractorsData.find(c => c.id === contractorId);
    const contractorName = contractor ? contractor.name : '[Not Selected]';
    
    const workOrderNumber = 'WO-' + Date.now().toString().slice(-8);
    const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const formattedDate = completionDate ? 
        new Date(completionDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }) : '[Not Set]';
    
    const preview = document.getElementById('workOrderPreview');
    preview.textContent = `
═══════════════════════════════════════════════════════
              WORK ORDER
═══════════════════════════════════════════════════════

<strong>Work Order Number:</strong> ${workOrderNumber}
<strong>Date:</strong> ${today}
<strong>Report ID:</strong> ${assignmentReportData.id}

───────────────────────────────────────────────────────
<strong>ASSIGNMENT DETAILS</strong>
───────────────────────────────────────────────────────

<strong>Contractor:</strong> ${contractorName}
<strong>Priority:</strong> ${priority.toUpperCase()}
<strong>Expected Completion:</strong> ${formattedDate}

───────────────────────────────────────────────────────
<strong>WORK LOCATION</strong>
───────────────────────────────────────────────────────

<strong>Location:</strong> ${assignmentReportData.location}
<strong>Address:</strong> ${assignmentReportData.address}
<strong>Damage Type:</strong> ${assignmentReportData.damageType}
<strong>Severity:</strong> ${assignmentReportData.severity}

───────────────────────────────────────────────────────
<strong>SPECIAL INSTRUCTIONS</strong>
───────────────────────────────────────────────────────

${instructions || 'None specified.'}

───────────────────────────────────────────────────────
<strong>ESTIMATED COST:</strong> ${assignmentReportData.estimatedCost}
<strong>ESTIMATED TIME:</strong> ${assignmentReportData.estimatedTime}
═══════════════════════════════════════════════════════
    `.trim();
}

/**
 * Assign work
 */
function assignWork() {
    const contractorId = document.getElementById('contractorSelect').value;
    const priority = document.getElementById('prioritySelect').value;
    const completionDate = document.getElementById('completionDate').value;
    
    if (!contractorId) {
        showAlert('Selection Required', 'Please select a contractor.', 'warning');
        return;
    }
    
    if (!completionDate) {
        showAlert('Date Required', 'Please set an expected completion date.', 'warning');
        return;
    }
    
    const contractor = contractorsData.find(c => c.id === contractorId);
    
    showConfirm('Confirm Assignment', `Assign work order to ${contractor.name}?\n\nPriority: ${priority}\nExpected Completion: ${new Date(completionDate).toLocaleDateString()}`, () => {
        showAlert('Assignment Successful', `Work order assigned successfully!\n\nContractor: ${contractor.name}\nReport ID: ${assignmentReportData.id}\n\nRedirecting to dashboard...`, 'success', () => {
            // Clear session storage
            sessionStorage.removeItem('selectedReportId');
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        });
    });
}

/**
 * Cancel assignment
 */
function cancelAssignment() {
    showConfirm('Confirm Cancellation', 'Are you sure you want to cancel? Changes will be lost.', () => {
        sessionStorage.removeItem('selectedReportId');
        window.location.href = 'dashboard.html';
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initAssignment);
