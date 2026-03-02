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
    const tbody = document.getElementById('reportsTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;"><div class="spinner"></div> Loading reports...</td></tr>';
    }

    try {
        const response = await Auth.fetchWithAuth('/api/official/reports');
        if (!response.ok) throw new Error('Failed to fetch reports');

        allOfficerReports = await response.json();
        filteredReports = [...allOfficerReports];

        initDashboard();
    } catch (error) {
        console.error('Load Error:', error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color:red;">Error loading reports: ${error.message}</td></tr>`;
        }
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
    const startDate = document.getElementById('startDateFilter').value;
    const endDate = document.getElementById('endDateFilter').value;
    const severityFilter = document.getElementById('severityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    filteredReports = allOfficerReports.filter(report => {
        const severityMatch = !severityFilter || (report.severity || '').toLowerCase() === severityFilter;

        let statusMatch = true;
        if (statusFilter) {
            if (statusFilter === 'pending') statusMatch = report.status === 'submitted';
            else if (statusFilter === 'verified') statusMatch = (report.status === 'verified' || report.status === 'approved');
            else statusMatch = report.status === statusFilter;
        }

        let dateMatch = true;
        if (startDate || endDate) {
            const reportDate = new Date(report.created_at);
            reportDate.setHours(0, 0, 0, 0);

            if (startDate) {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);
                if (reportDate < sDate) dateMatch = false;
            }
            if (endDate) {
                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999);
                if (reportDate > eDate) dateMatch = false;
            }
        }

        return severityMatch && statusMatch && dateMatch;
    });

    renderReportsTable();
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('startDateFilter').value = '';
    document.getElementById('endDateFilter').value = '';
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
        else if (report.status === 'verified' || report.status === 'approved') { statusClass = 'verified'; statusText = 'Verified'; }
        else if (report.status === 'assigned') { statusClass = 'in-progress'; statusText = 'Assigned'; }
        else if (report.status === 'in-progress') { statusClass = 'in-progress'; statusText = 'In Progress'; }
        else if (report.status === 'resolved') { statusClass = 'completed'; statusText = 'Resolved'; }
        else if (report.status === 'rejected') { statusClass = 'completed'; statusText = 'Rejected'; }

        const dateStr = report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A';

        return `
            <tr>
                <td>${report.id.substring(0, 8)}...</td>
                <td>${report.location || 'Unknown'}</td>
                <td><span class="status-chip ${severityClass}">${severityText}</span></td>
                <td><span class="status-chip status-${statusClass}">${statusText}</span></td>
                <td>${dateStr}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="openPanel('${encodeURIComponent(JSON.stringify(report))}')">View</button>
                        ${report.status === 'submitted' ? `
                            <button class="btn btn-success" onclick="verifyReport('${report.id}')">Verify</button>
                        ` : ''}
                        ${(report.status === 'verified' || report.status === 'approved') ? `
                            <button class="btn btn-secondary" onclick="assignReport('${report.id}')">Assign</button>
                        ` : ''}
                        ${(report.status === 'assigned' || report.status === 'in-progress') ? `
                            <button class="btn btn-info" onclick="monitorReport('${report.id}')">Monitor</button>
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
    const report = allOfficerReports.find(r => r.id === id);
    if (report) openPanel(encodeURIComponent(JSON.stringify(report)));
};

window.verifyReport = (id) => {
    window.location.href = `verification.html?id=${id}`;
};
window.assignReport = (id) => {
    window.location.href = `assignment.html?id=${id}`;
};
window.monitorReport = (id) => {
    window.location.href = `monitoring.html?id=${id}`;
};

// --- Slide Panel Logic ---
let panelMap = null;
let panelMarker = null;

function openPanel(reportJson) {
    const report = JSON.parse(decodeURIComponent(reportJson));

    // 1. Fill Text Data
    document.getElementById("panelDamageType").textContent = report.damage_type || "Unknown";
    document.getElementById("panelConfidence").textContent =
        report.confidence ? (report.confidence * 100).toFixed(1) + "%" : "N/A";
    document.getElementById("panelSeverity").textContent = report.severity || "Pending";
    document.getElementById("panelStatus").textContent = report.status || "Submitted";

    // 2. Open the Panel
    document.getElementById("reportPanel").classList.add("open");

    // 3. Load Map (Wait for transition to finish)
    setTimeout(() => {
        loadPanelMap(report.latitude, report.longitude);
    }, 300);
}

function closePanel() {
    document.getElementById("reportPanel").classList.remove("open");
}

function loadPanelMap(lat, lng) {
    if (!lat || !lng) {
        console.error("No coordinates available for this report.");
        return;
    }

    if (!panelMap) {
        // Initialize map if it doesn't exist
        panelMap = L.map("panelMap").setView([lat, lng], 15);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap"
        }).addTo(panelMap);

        panelMarker = L.marker([lat, lng]).addTo(panelMap);
    } else {
        // Move existing map and marker
        panelMap.setView([lat, lng], 15);
        panelMarker.setLatLng([lat, lng]);
    }

    // Force Leaflet to recalculate size (prevents gray tiles)
    setTimeout(() => panelMap.invalidateSize(), 200);
}

// Expose open/close to window for HTML onclicks
window.openPanel = openPanel;
window.closePanel = closePanel;