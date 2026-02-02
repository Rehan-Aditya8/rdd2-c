// Officer Dashboard JavaScript

let allOfficerReports = [];
let filteredReports = [];

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', async () => {
    Auth.requireRole('official');
    await loadReports();
});

/**
 * Fetch reports from API
 */
async function loadReports() {
    try {
        const response = await Auth.fetchWithAuth('/api/official/reports');
        if (!response.ok) throw new Error('Failed to fetch reports');

        allOfficerReports = await response.json();
        filteredReports = [...allOfficerReports];

        initDashboard();
    } catch (error) {
        console.error('Load Error:', error);
    }
}

/**
 * Initialize dashboard
 */
function initDashboard() {
    updateKPIs();
    renderReportsTable();
}

/**
 * Update KPI cards
 */
function updateKPIs() {
    const total = allOfficerReports.length;
    const pending = allOfficerReports.filter(r => r.status === 'submitted').length; // 'submitted' is pending verification
    const inProgress = allOfficerReports.filter(r => ['verified', 'assigned', 'in-progress'].includes(r.status)).length;
    const critical = allOfficerReports.filter(r => r.severity === 'critical' || r.severity === 'high').length;

    document.getElementById('totalReports').textContent = total;
    document.getElementById('pendingReports').textContent = pending;
    document.getElementById('inProgressReports').textContent = inProgress;
    document.getElementById('criticalReports').textContent = critical;
}

/**
 * Apply filters
 */
function applyFilters() {
    // Note: Backend might not return 'sector' yet, so filtering might be limited
    const sectorFilter = document.getElementById('sectorFilter').value;
    const severityFilter = document.getElementById('severityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    filteredReports = allOfficerReports.filter(report => {
        // const sectorMatch = !sectorFilter || report.sector === sectorFilter; 
        const sectorMatch = true; // Temporary disable until sector is in DB
        const severityMatch = !severityFilter || (report.severity || '').toLowerCase() === severityFilter;
        // Map frontend status filter to backend status
        let statusMatch = true;
        if (statusFilter) {
            if (statusFilter === 'pending') statusMatch = report.status === 'submitted';
            else statusMatch = report.status === statusFilter;
        }

        return sectorMatch && severityMatch && statusMatch;
    });

    renderReportsTable();
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('sectorFilter').value = '';
    document.getElementById('severityFilter').value = '';
    document.getElementById('statusFilter').value = '';
    filteredReports = [...allOfficerReports];
    renderReportsTable();
}

/**
 * Render reports table
 */
function renderReportsTable() {
    const tbody = document.getElementById('reportsTableBody');

    if (filteredReports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No reports found matching the filters.</td></tr>';
        return;
    }

    tbody.innerHTML = filteredReports.map(report => {
        const severity = report.severity || 'pending';
        const severityClass = `severity-${severity.toLowerCase()}`;
        const severityText = severity.charAt(0).toUpperCase() + severity.slice(1);

        // Status mapping
        let statusClass = 'pending';
        let statusText = report.status;

        if (report.status === 'submitted') { statusClass = 'pending'; statusText = 'Pending Verification'; }
        else if (report.status === 'verified') { statusClass = 'verified'; statusText = 'Verified'; }
        else if (report.status === 'in-progress') { statusClass = 'in-progress'; statusText = 'In Progress'; }
        else if (report.status === 'resolved') { statusClass = 'completed'; statusText = 'Resolved'; }
        else if (report.status === 'rejected') { statusClass = 'completed'; statusText = 'Rejected'; }

        // Mock date if missing (or format robustly)
        // const dateStr = report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A';
        // The API returns 'image_url' which we can use for View

        return `
            <tr>
                <td>${report.id.substring(0, 8)}...</td>
                <td>${report.location || 'Unknown'}</td>
                <td>-</td> <!-- Sector -->
                <td><span class="status-chip ${severityClass}">${severityText}</span></td>
                <td><span class="status-chip status-${statusClass}">${statusText}</span></td>
                <td>-</td> <!-- Date -->
                <td>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="viewReport('${report.id}')">View</button>
                        ${report.status === 'submitted' ? `
                            <button class="btn btn-success" onclick="verifyReport('${report.id}')">Verify</button>
                        ` : ''}
                        ${report.status === 'verified' ? `
                            <button class="btn btn-secondary" onclick="assignReport('${report.id}')">Assign</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Expose functions to window
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.viewReport = (id) => {
    sessionStorage.setItem('selectedReportId', id);
    // TODO: Navigate to detail view
    alert('View details for: ' + id);
};
window.verifyReport = (id) => {
    sessionStorage.setItem('selectedReportId', id);
    window.location.href = 'verification.html';
};
window.assignReport = (id) => {
    sessionStorage.setItem('selectedReportId', id);
    window.location.href = 'assignment.html';
};
