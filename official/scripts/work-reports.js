// =====================================================
// OFFICIAL AUTH GUARD
// =====================================================
Auth.requireRole('official');

// =====================================================
// STATE
// =====================================================
let workReports = [];
let currentReports = [];

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupDropZone();
});

async function initDashboard() {
    await loadReports();
    updateKPIs();
    renderTable();
}

// =====================================================
// LOAD REPORTS (CORRECT API)
// =====================================================
async function loadReports() {
    try {
        const response = await Auth.fetchWithAuth('/api/official/reports');
        if (!response.ok) throw new Error('Failed to fetch reports');

        workReports = await response.json();
        currentReports = [...workReports];
    } catch (error) {
        showModal('Error', error.message);
    }
}

// =====================================================
// KPIs (MATCH BACKEND STATUSES)
// =====================================================
function updateKPIs() {
    document.getElementById('totalNotices').textContent = workReports.length;
    document.getElementById('pendingVerify').textContent =
        workReports.filter(r => r.status === 'PENDING').length;

    document.getElementById('criticalWork').textContent =
        workReports.filter(r => r.severity === 'CRITICAL').length;

    document.getElementById('activeDiversions').textContent =
        workReports.filter(r => r.status === 'IN_PROGRESS').length;
}

// =====================================================
// TABLE
// =====================================================
function renderTable() {
    const tbody = document.getElementById('reportsTableBody');

    if (currentReports.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="9" style="text-align:center;padding:2rem;">
                No reports found
            </td>
        </tr>`;
        return;
    }

    tbody.innerHTML = currentReports.map(report => `
        <tr>
            <td><strong>${report.id}</strong></td>
            <td>${report.location}</td>
            <td>${report.department}</td>
            <td>${report.damage_type}</td>
            <td>${report.created_at}</td>
            <td>${report.traffic_diversion ? 'YES' : 'NO'}</td>
            <td>${report.severity}</td>
            <td>${report.status}</td>
            <td>
                <button class="btn btn-primary btn-sm"
                    onclick="openSidePanel('${report.id}')">
                    View
                </button>

                ${(report.status === 'submitted' || report.status === 'PENDING')
            ? `<button class="btn btn-success btn-sm"
                        onclick="goToVerification('${report.id}')">
                        Verify
                    </button>`
            : ''}

                ${report.status === 'approved'
            ? `<button class="btn btn-warning btn-sm"
                        onclick="window.location.href='assignment.html?id=${report.id}'">
                        Assign
                    </button>`
            : ''}
            </td>
        </tr>
    `).join('');
}

// =====================================================
// FILTERS
// =====================================================
function applyFilters() {
    const dept = document.getElementById('deptFilter').value;
    const status = document.getElementById('statusFilter').value;

    currentReports = workReports.filter(r =>
        (!dept || r.department === dept) &&
        (!status || r.status === status)
    );

    renderTable();
}

function clearFilters() {
    document.getElementById('deptFilter').value = '';
    document.getElementById('statusFilter').value = '';
    currentReports = [...workReports];
    renderTable();
}

// =====================================================
// NAVIGATION (CRITICAL FIX)
// =====================================================
function goToVerification(reportId) {
    window.location.href = `verification.html?id=${reportId}`;
}

// =====================================================
// SIDE PANEL (SAFE)
// =====================================================
function openSidePanel(reportId) {
    const report = workReports.find(r => r.id === reportId);
    if (!report) return;

    document.getElementById('panelContent').innerHTML = `
        <p><strong>Location:</strong> ${report.location}</p>
        <p><strong>Damage:</strong> ${report.damage_type}</p>
        <p><strong>Confidence:</strong> ${(report.confidence * 100).toFixed(2)}%</p>
        <p><strong>Status:</strong> ${report.status}</p>
    `;

    document.getElementById('panelFooter').innerHTML =
        (report.status === 'submitted' || report.status === 'PENDING')
            ? `<button class="btn btn-success"
                   onclick="goToVerification('${report.id}')">
                   Verify
               </button>`
            : (report.status === 'approved')
                ? `<button class="btn btn-warning"
                       onclick="window.location.href='assignment.html?id=${report.id}'">
                       Assign Work
                   </button>`
                : `<button class="btn btn-secondary"
                   onclick="closeSidePanel()">Close</button>`;

    document.getElementById('sidePanel').classList.add('open');
    document.getElementById('sidePanelOverlay').classList.add('open');
}

function closeSidePanel() {
    document.getElementById('sidePanel').classList.remove('open');
    document.getElementById('sidePanelOverlay').classList.remove('open');
}

// =====================================================
// EXPORT GLOBALS
// =====================================================
window.goToVerification = goToVerification;
window.openSidePanel = openSidePanel;
window.closeSidePanel = closeSidePanel;
window.clearFilters = clearFilters;
