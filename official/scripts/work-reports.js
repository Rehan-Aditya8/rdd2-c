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
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;"><div class="spinner"></div> Loading reports...</td></tr>`;

    try {
        const response = await Auth.fetchWithAuth('/api/official/work-reports');

        if (!response.ok) throw new Error('Failed to fetch reports');

        workReports = await response.json();
        currentReports = [...workReports];
        renderTable();
    } catch (error) {
        console.error('Error loading reports:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:red;">Error: ${error.message}</td></tr>`;
        showModal('Error', error.message);
    }
}

// =====================================================
// KPIs (MATCH BACKEND STATUSES)
// =====================================================
function updateKPIs() {
    document.getElementById('totalNotices').textContent = workReports.length;

    document.getElementById('pendingVerify').textContent =
        workReports.filter(r => r.status === 'pending').length;

    document.getElementById('criticalWork').textContent = '—';   // Not applicable to work notices
    document.getElementById('activeDiversions').textContent = '—'; // Not applicable to work notices
}


// =====================================================
// TABLE
// =====================================================
function renderTable() {
    const tbody = document.getElementById('reportsTableBody');

    if (currentReports.length === 0) {
        tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:2rem;">
                        No notices found
                    </td>
                </tr>`;
        return;
    }

    tbody.innerHTML = currentReports.map(report => {
        const uniqueNoticeId = report.notice_id ? report.notice_id.split('-')[0].substring(0, 8) : report.id.split('-')[0].substring(0, 8);
        return `
            <tr>
                <td title="${report.notice_id || report.id}"><strong>NTC-${uniqueNoticeId.toUpperCase()}</strong></td>
                <td>${report.location || '-'}</td>
                <td style="color: var(--text-dark); font-weight: 500;">Roads</td>
                <td>${report.work_type || '-'}</td>
                <td>${new Date(report.created_at).toLocaleDateString()}</td>
                <td><span class="pill ${report.status === 'completed' ? 'pill-resolved' : (report.status === 'in_progress' || report.status === 'assigned' ? 'pill-progress' : 'pill-pending')}">${report.status}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-action btn-view" title="View Details" onclick="openSidePanel('${report.id}')">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                            View
                        </button>
                        ${(report.status === 'verified' || report.status === 'approved' || report.status === 'pending') ? `
                            <button class="btn-action btn-assign" title="Assign" onclick="goToAssignment('${report.id}')">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
                                </svg>
                                Assign
                            </button>
                        ` : ''}
                        ${(report.status === 'assigned' || report.status === 'in_progress') ? `
                            <button class="btn-action btn-monitor" title="Monitor" onclick="goToMonitoring('${report.id}')">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                Monitor
                            </button>
                            <button class="btn-action btn-completed" title="Assignment Done" style="cursor: default; opacity: 0.8; background-color: var(--success-bg, #dcfce7); color: var(--success-text, #166534); border: 1px solid var(--success-border, #bbf7d0);" onclick="event.preventDefault();">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 6 9 17l-5-5"/>
                                </svg>
                                Completed
                            </button>
                        ` : ''}
                        ${(report.status === 'resolved' || report.status === 'completed') ? `
                            <button class="btn-action btn-completed" title="Completed" style="cursor: default; opacity: 0.8; background-color: var(--success-bg, #dcfce7); color: var(--success-text, #166534); border: 1px solid var(--success-border, #bbf7d0);" onclick="event.preventDefault();">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 6 9 17l-5-5"/>
                                </svg>
                                Completed
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}


// =====================================================
// FILTERS
// =====================================================
function applyFilters() {
    const dept = document.getElementById('deptFilter').value;
    const status = document.getElementById('statusFilter').value;
    const startDate = document.getElementById('startDateFilter').value;
    const endDate = document.getElementById('endDateFilter').value;

    currentReports = workReports.filter(r => {
        const matchesDept = !dept || r.department === dept;
        const matchesStatus = !status || r.status === status;

        let matchesDate = true;
        if (r.created_at) {
            const reportDate = new Date(r.created_at).toISOString().split('T')[0];
            if (startDate && reportDate < startDate) matchesDate = false;
            if (endDate && reportDate > endDate) matchesDate = false;
        }

        return matchesDept && matchesStatus && matchesDate;
    });

    renderTable();
}

function clearFilters() {
    document.getElementById('deptFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('startDateFilter').value = '';
    document.getElementById('endDateFilter').value = '';
    currentReports = [...workReports];
    renderTable();
}

// =====================================================
// NAVIGATION (CRITICAL FIX)
// =====================================================
function goToVerification(reportId) {
    const report = workReports.find(r => r.id === reportId);
    let isDashcam = false;
    if (report) {
        if (report.report_source === 'dashcam') {
            isDashcam = true;
        } else if (report.image_url && report.image_url.includes('dashcam_first_')) {
            isDashcam = true;
        }
    }
    const page = isDashcam ? 'dashcam-verification.html' : 'verification.html';
    window.location.href = `${page}?id=${reportId}&type=work`;
}

function goToAssignment(reportId) {
    const report = workReports.find(r => r.id === reportId);
    let isDashcam = false;
    if (report) {
        if (report.report_source === 'dashcam') {
            isDashcam = true;
        } else if (report.image_url && report.image_url.includes('dashcam_first_')) {
            isDashcam = true;
        }
    }
    const page = isDashcam ? 'dashcam-assignment.html' : 'assignment.html';
    window.location.href = `${page}?id=${reportId}&type=work`;
}

function goToMonitoring(reportId) {
    const report = workReports.find(r => r.id === reportId);
    let isDashcam = false;
    if (report) {
        if (report.report_source === 'dashcam') {
            isDashcam = true;
        } else if (report.image_url && report.image_url.includes('dashcam_first_')) {
            isDashcam = true;
        }
    }
    const page = isDashcam ? 'dashcam-monitoring.html' : 'monitoring.html';
    window.location.href = `${page}?id=${reportId}&type=work`;
}

// =====================================================
// SIDE PANEL (SAFE)
// =====================================================
function openSidePanel(reportId) {
    const report = workReports.find(r => r.id === reportId);
    if (!report) return;

    const uniqueNoticeId = report.notice_id ? report.notice_id : `NTC-${report.id.split('-')[0].substring(0, 8).toUpperCase()}`;

    document.getElementById('panelContent').innerHTML = `
            <p><strong>Notice ID:</strong> ${uniqueNoticeId}</p>
            <p><strong>Department:</strong> ${report.department}</p>
            <p><strong>Work Type:</strong> ${report.work_type}</p>
            <p><strong>Location:</strong> ${report.location}</p>
            <p><strong>Executing Agency:</strong> ${report.executing_agency || '-'}</p>
            <p><strong>Contractor Contact:</strong> ${report.contractor_contact || '-'}</p>
            <p><strong>Status:</strong> ${report.status}</p>
        `;

    document.getElementById('panelFooter').innerHTML = `
            <button class="btn btn-secondary" onclick="closeSidePanel()">Close</button>
            ${report.pdf_url ? `
                <button class="btn btn-primary"
                    onclick="downloadNotice('${report.id}')">
                    ⬇ Download PDF
                </button>
            ` : ''}
        `;

    document.getElementById('sidePanel').classList.add('open');
    document.getElementById('sidePanelOverlay').classList.add('open');
}


function closeSidePanel() {
    document.getElementById('sidePanel').classList.remove('open');
    document.getElementById('sidePanelOverlay').classList.remove('open');
}

async function downloadNotice(reportId) {
    try {
        const response = await Auth.fetchWithAuth(`/api/official/work-reports/${reportId}/download`);

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Download failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `work-notice-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);
    } catch (error) {
        showModal('Download Failed', error.message);
    }
}


// =====================================================
// CREATE REPORT MODAL
// =====================================================
function openCreateReportModal() {
    document.getElementById('createReportModal').style.display = 'flex';
}

function closeCreateReportModal() {
    document.getElementById('createReportModal').style.display = 'none';
}

window.openCreateReportModal = openCreateReportModal;
window.closeCreateReportModal = closeCreateReportModal;


// =====================================================
// DROP ZONE SETUP
// =====================================================
function setupDropZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const file = e.dataTransfer.files[0];
        if (file) uploadNoticePDF(file);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) uploadNoticePDF(fileInput.files[0]);
    });
}

// =====================================================
// UPLOAD PDF
// =====================================================
async function uploadNoticePDF(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showModal('Invalid File', 'Please upload a PDF file only.');
        return;
    }

    const extractionStatus = document.getElementById('extractionStatus');
    extractionStatus.style.display = 'flex';

    const formData = new FormData();
    formData.append('pdf', file);

    try {
        const response = await Auth.fetchWithAuth('/api/official/work-reports/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.msg || 'Upload failed');
        }

        showModal('Success', 'Notice uploaded and extracted successfully!');
        closeCreateReportModal();
        await loadReports();
        updateKPIs();
        renderTable();

    } catch (err) {
        console.error('Upload error:', err);
        showModal('Error', err.message);
    } finally {
        extractionStatus.style.display = 'none';
        document.getElementById('fileInput').value = ''; // Reset
    }
}


// =====================================================
// EXPORT GLOBALS
// =====================================================
window.goToVerification = goToVerification;
window.goToAssignment = goToAssignment;
window.goToMonitoring = goToMonitoring;
window.openSidePanel = openSidePanel;
window.closeSidePanel = closeSidePanel;
window.clearFilters = clearFilters;
window.downloadNotice = downloadNotice;

