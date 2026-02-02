// Tracking Screen JavaScript

// Dummy reports data
// Data fetched from API
let allReportsData = [];

let currentReport = null;

/**
 * Initialize tracking page
 */
// Fetch reports from API
try {
    const response = await Auth.fetchWithAuth('/api/citizen/reports');
    if (response.ok) {
        const apiData = await response.json();

        // Transform API data to frontend model
        allReportsData = apiData.map(r => {
            // Determine timeline state based on status
            const steps = ['submitted', 'verified', 'assigned', 'in-progress', 'resolved'];
            const labels = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Completed'];

            let currentStageIndex = steps.indexOf(r.status);
            if (currentStageIndex === -1 && r.status === 'rejected') currentStageIndex = 0; // Treat rejected as just reported for now
            if (currentStageIndex === -1) currentStageIndex = 0;

            const timeline = labels.map((label, idx) => ({
                step: label,
                date: idx <= currentStageIndex ? (idx === 0 ? new Date(r.created_at).toLocaleString() : 'Done') : null,
                completed: idx < currentStageIndex,
                active: idx === currentStageIndex
            }));

            return {
                id: r.id,
                location: r.location,
                date: new Date(r.created_at).toLocaleDateString(),
                status: r.status,
                statusText: r.status.charAt(0).toUpperCase() + r.status.slice(1),
                image: `/api/files/images/${r.id}.jpg`, // Assumption: Backend image path logic
                department: {
                    name: 'Public Works Department',
                    contact: 'help@pwd.gov',
                    phone: '123-456-7890'
                },
                timeline: timeline,
                repairPhotos: []
            };
        });
    }
} catch (e) {
    console.error("Failed to load reports", e);
}

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
