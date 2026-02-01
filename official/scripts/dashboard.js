// Officer Dashboard JavaScript

// Dummy reports data
const allOfficerReports = [
    {
        id: 'RPT-001',
        location: 'Main Street, Block 5',
        sector: 'sector1',
        severity: 'high',
        status: 'in-progress',
        statusText: 'In Progress',
        date: '2024-01-15',
        assignedTo: 'Contractor A'
    },
    {
        id: 'RPT-002',
        location: 'Park Avenue, Near School',
        sector: 'sector2',
        severity: 'medium',
        status: 'pending',
        statusText: 'Pending Verification',
        date: '2024-01-14',
        assignedTo: null
    },
    {
        id: 'RPT-003',
        location: 'Highway 101, Exit 3',
        sector: 'sector3',
        severity: 'critical',
        status: 'completed',
        statusText: 'Completed',
        date: '2024-01-10',
        assignedTo: 'Contractor B'
    },
    {
        id: 'RPT-004',
        location: 'Oak Street, Intersection',
        sector: 'sector1',
        severity: 'low',
        status: 'verified',
        statusText: 'Verified',
        date: '2024-01-12',
        assignedTo: null
    },
    {
        id: 'RPT-005',
        location: 'Elm Avenue, Block 12',
        sector: 'sector4',
        severity: 'high',
        status: 'assigned',
        statusText: 'Assigned',
        date: '2024-01-11',
        assignedTo: 'Contractor C'
    },
    {
        id: 'RPT-006',
        location: 'Maple Drive, Corner',
        sector: 'sector2',
        severity: 'medium',
        status: 'pending',
        statusText: 'Pending Verification',
        date: '2024-01-13',
        assignedTo: null
    },
    {
        id: 'RPT-007',
        location: 'Cedar Lane, Block 8',
        sector: 'sector3',
        severity: 'critical',
        status: 'in-progress',
        statusText: 'In Progress',
        date: '2024-01-09',
        assignedTo: 'Contractor A'
    }
];

let filteredReports = [...allOfficerReports];

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
    const pending = allOfficerReports.filter(r => r.status === 'pending').length;
    const inProgress = allOfficerReports.filter(r => r.status === 'in-progress').length;
    const critical = allOfficerReports.filter(r => r.severity === 'critical').length;
    
    document.getElementById('totalReports').textContent = total;
    document.getElementById('pendingReports').textContent = pending;
    document.getElementById('inProgressReports').textContent = inProgress;
    document.getElementById('criticalReports').textContent = critical;
}

/**
 * Apply filters
 */
function applyFilters() {
    const sectorFilter = document.getElementById('sectorFilter').value;
    const severityFilter = document.getElementById('severityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    filteredReports = allOfficerReports.filter(report => {
        const sectorMatch = !sectorFilter || report.sector === sectorFilter;
        const severityMatch = !severityFilter || report.severity === severityFilter;
        const statusMatch = !statusFilter || report.status === statusFilter;
        
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
        const severityClass = `severity-${report.severity}`;
        const severityText = report.severity.charAt(0).toUpperCase() + report.severity.slice(1);
        
        return `
            <tr>
                <td>${report.id}</td>
                <td>${report.location}</td>
                <td>${report.sector}</td>
                <td><span class="status-chip ${severityClass}">${severityText}</span></td>
                <td><span class="status-chip status-${report.status}">${report.statusText}</span></td>
                <td>${report.date}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="viewReport('${report.id}')">View</button>
                        ${report.status === 'pending' ? `
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

/**
 * View report details
 */
function viewReport(reportId) {
    sessionStorage.setItem('selectedReportId', reportId);
    const report = allOfficerReports.find(r => r.id === reportId);
    
    if (report.status === 'pending') {
        window.location.href = 'verification.html';
    } else {
        showAlert('Report Details', `ID: ${report.id}\n\nLocation: ${report.location}\nSector: ${report.sector}\nSeverity: ${report.severity}\nStatus: ${report.statusText}\nDate: ${report.date}`, 'info');
    }
}

/**
 * Verify report
 */
function verifyReport(reportId) {
    sessionStorage.setItem('selectedReportId', reportId);
    window.location.href = 'verification.html';
}

/**
 * Assign report
 */
function assignReport(reportId) {
    sessionStorage.setItem('selectedReportId', reportId);
    window.location.href = 'assignment.html';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initDashboard);
