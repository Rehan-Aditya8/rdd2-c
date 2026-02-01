// Tracking Screen JavaScript

// Dummy reports data
const allReportsData = [
    {
        id: 'RPT-001',
        location: 'Main Street, Block 5',
        date: '2024-01-15',
        status: 'in-progress',
        statusText: 'In Progress',
        image: 'https://via.placeholder.com/600x400/667eea/ffffff?text=Damage+Photo',
        department: {
            name: 'Public Works Department',
            contact: 'pwd@city.gov',
            phone: '+91-11-2345-6789'
        },
        timeline: [
            { step: 'Reported', date: '2024-01-15 10:30 AM', completed: true },
            { step: 'Verified', date: '2024-01-15 2:15 PM', completed: true },
            { step: 'Assigned', date: '2024-01-16 9:00 AM', completed: true },
            { step: 'In Progress', date: '2024-01-16 11:00 AM', completed: true, active: true },
            { step: 'Completed', date: null, completed: false }
        ],
        repairPhotos: []
    },
    {
        id: 'RPT-002',
        location: 'Park Avenue, Near School',
        date: '2024-01-14',
        status: 'reported',
        statusText: 'Reported',
        image: 'https://via.placeholder.com/600x400/764ba2/ffffff?text=Damage+Photo',
        department: {
            name: 'Road Maintenance Division',
            contact: 'roadmaint@city.gov',
            phone: '+91-11-2345-6790'
        },
        timeline: [
            { step: 'Reported', date: '2024-01-14 3:45 PM', completed: true, active: true },
            { step: 'Verified', date: null, completed: false },
            { step: 'Assigned', date: null, completed: false },
            { step: 'In Progress', date: null, completed: false },
            { step: 'Completed', date: null, completed: false }
        ],
        repairPhotos: []
    },
    {
        id: 'RPT-003',
        location: 'Highway 101, Exit 3',
        date: '2024-01-10',
        status: 'completed',
        statusText: 'Completed',
        image: 'https://via.placeholder.com/600x400/28a745/ffffff?text=Damage+Photo',
        department: {
            name: 'Highway Maintenance',
            contact: 'highway@city.gov',
            phone: '+91-11-2345-6791'
        },
        timeline: [
            { step: 'Reported', date: '2024-01-10 8:20 AM', completed: true },
            { step: 'Verified', date: '2024-01-10 10:00 AM', completed: true },
            { step: 'Assigned', date: '2024-01-10 2:30 PM', completed: true },
            { step: 'In Progress', date: '2024-01-11 9:00 AM', completed: true },
            { step: 'Completed', date: '2024-01-12 4:00 PM', completed: true, active: true }
        ],
        repairPhotos: [
            { url: 'https://via.placeholder.com/300x200/28a745/ffffff?text=After+Repair+1', label: 'After Repair - View 1' },
            { url: 'https://via.placeholder.com/300x200/28a745/ffffff?text=After+Repair+2', label: 'After Repair - View 2' }
        ]
    }
];

let currentReport = null;

/**
 * Initialize tracking page
 */
function initTracking() {
    // Populate report selector
    const selector = document.getElementById('reportSelector');
    allReportsData.forEach(report => {
        const option = document.createElement('option');
        option.value = report.id;
        option.textContent = `${report.id} - ${report.location} (${report.statusText})`;
        selector.appendChild(option);
    });
    
    // Check if a report was selected from dashboard
    const selectedReportId = sessionStorage.getItem('selectedReportId');
    if (selectedReportId) {
        selector.value = selectedReportId;
        loadReportDetails();
        sessionStorage.removeItem('selectedReportId');
    }
    
    // Render all reports table
    renderAllReportsTable();
}

/**
 * Load report details
 */
function loadReportDetails() {
    const reportId = document.getElementById('reportSelector').value;
    if (!reportId) {
        document.getElementById('reportDetails').style.display = 'none';
        return;
    }
    
    currentReport = allReportsData.find(r => r.id === reportId);
    if (!currentReport) return;
    
    // Show report details section
    document.getElementById('reportDetails').style.display = 'block';
    
    // Render timeline
    renderTimeline();
    
    // Set report image
    document.getElementById('reportImage').src = currentReport.image;
    
    // Set department info
    renderDepartmentInfo();
    
    // Show/hide repair photos
    if (currentReport.status === 'completed' && currentReport.repairPhotos.length > 0) {
        document.getElementById('repairPhotosSection').style.display = 'block';
        document.getElementById('viewEvidenceBtn').style.display = 'inline-block';
        renderRepairPhotos();
    } else {
        document.getElementById('repairPhotosSection').style.display = 'none';
        document.getElementById('viewEvidenceBtn').style.display = 'none';
    }
}

/**
 * Render status timeline
 */
function renderTimeline() {
    const timelineContainer = document.getElementById('statusTimeline');
    timelineContainer.innerHTML = currentReport.timeline.map((item, index) => {
        let className = 'timeline-item';
        if (item.completed) className += ' completed';
        if (item.active) className += ' active';
        
        return `
            <div class="${className}">
                <div class="timeline-content">
                    <strong>${item.step}</strong>
                    ${item.date ? `<div class="timeline-date">${item.date}</div>` : '<div class="timeline-date">Pending</div>'}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render department information
 */
function renderDepartmentInfo() {
    const deptInfo = document.getElementById('departmentInfo');
    deptInfo.innerHTML = `
        <div class="department-detail">
            <strong>Department:</strong> ${currentReport.department.name}
        </div>
        <div class="department-detail">
            <strong>Email:</strong> ${currentReport.department.contact}
        </div>
        <div class="department-detail">
            <strong>Phone:</strong> ${currentReport.department.phone}
        </div>
    `;
}

/**
 * Render repair photos
 */
function renderRepairPhotos() {
    const grid = document.getElementById('repairPhotosGrid');
    grid.innerHTML = currentReport.repairPhotos.map(photo => `
        <div class="repair-photo-card">
            <img src="${photo.url}" alt="${photo.label}">
            <div class="photo-label">${photo.label}</div>
        </div>
    `).join('');
}

/**
 * View full details
 */
function viewFullDetails() {
    if (!currentReport) return;
    showAlert('Report Details', `Full Details for ${currentReport.id}:\n\nLocation: ${currentReport.location}\nStatus: ${currentReport.statusText}\nDate: ${currentReport.date}\n\nDepartment: ${currentReport.department.name}`, 'info');
}

/**
 * View evidence
 */
function viewEvidence() {
    if (!currentReport || currentReport.repairPhotos.length === 0) return;
    // Scroll to repair photos section
    document.getElementById('repairPhotosSection').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Render all reports table
 */
function renderAllReportsTable() {
    const tbody = document.getElementById('allReportsTable');
    tbody.innerHTML = allReportsData.map(report => `
        <tr>
            <td>${report.id}</td>
            <td>${report.location}</td>
            <td>${report.date}</td>
            <td><span class="status-chip status-${report.status}">${report.statusText}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="selectReport('${report.id}')">View</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Select report from table
 */
function selectReport(reportId) {
    document.getElementById('reportSelector').value = reportId;
    loadReportDetails();
    document.getElementById('reportSelector').scrollIntoView({ behavior: 'smooth' });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initTracking);
