// Citizen Dashboard JavaScript

// Dummy data for recent reports
const recentReportsData = [
    {
        id: 'RPT-001',
        title: 'Pothole on Main Street',
        location: 'Main Street, Block 5',
        date: '2024-01-15',
        status: 'in-progress',
        statusText: 'In Progress'
    },
    {
        id: 'RPT-002',
        title: 'Cracked Road Surface',
        location: 'Park Avenue, Near School',
        date: '2024-01-14',
        status: 'reported',
        statusText: 'Reported'
    },
    {
        id: 'RPT-003',
        title: 'Severe Pothole',
        location: 'Highway 101, Exit 3',
        date: '2024-01-10',
        status: 'completed',
        statusText: 'Completed'
    },
    {
        id: 'RPT-004',
        title: 'Road Surface Damage',
        location: 'Oak Street, Intersection',
        date: '2024-01-08',
        status: 'completed',
        statusText: 'Completed'
    },
    {
        id: 'RPT-005',
        title: 'Large Pothole',
        location: 'Elm Avenue, Block 12',
        date: '2024-01-05',
        status: 'completed',
        statusText: 'Completed'
    }
];

/**
 * Render recent reports list
 */
function renderRecentReports() {
    const container = document.getElementById('recentReportsList');
    const recentReports = recentReportsData.slice(0, 5); // Show last 5
    
    container.innerHTML = recentReports.map(report => `
        <div class="report-card">
            <div class="report-card-info">
                <div class="report-card-title">${report.title}</div>
                <div class="report-card-meta">
                    📍 ${report.location} | 📅 ${report.date}
                </div>
                <span class="status-chip status-${report.status}">${report.statusText}</span>
            </div>
            <div class="report-card-actions">
                <button class="btn btn-secondary" onclick="viewReport('${report.id}')">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * View report details
 */
function viewReport(reportId) {
    // Store report ID in sessionStorage for tracking page
    sessionStorage.setItem('selectedReportId', reportId);
    window.location.href = 'tracking.html';
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    renderRecentReports();
});
