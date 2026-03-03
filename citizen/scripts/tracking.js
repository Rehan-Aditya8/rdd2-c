// Tracking Screen JavaScript

// Data fetched from API
let allReportsData = [];
let filteredReports = [];
let currentReport = null;

// Pagination state
const REPORTS_PER_PAGE = 3;
let currentPage = 1;

// Image blob cache (image_url -> blob URL)
let blobImageCache = {};

/**
 * Initialize tracking page
 */
async function initTracking() {
    // Fetch reports from API
    try {
        const response = await Auth.fetchWithAuth('/api/citizen/reports');
        if (response.ok) {
            const apiData = await response.json();

            // Transform API data to frontend model
            allReportsData = apiData.map(r => {
                // Determine timeline state based on status
                const steps = ['submitted', 'approved', 'assigned', 'in-progress', 'resolved'];
                const labels = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Completed'];

                let currentStageIndex = steps.indexOf(r.status);
                if (currentStageIndex === -1 && r.status === 'rejected') currentStageIndex = 0;
                if (currentStageIndex === -1) currentStageIndex = 0;

                const timeline = labels.map((label, idx) => ({
                    step: label,
                    date: idx <= currentStageIndex ? (idx === 0 ? new Date(r.created_at).toLocaleString() : 'Done') : null,
                    completed: idx < currentStageIndex,
                    active: idx === currentStageIndex
                }));

                return {
                    id: r.id,
                    location: r.location || 'Unknown Location',
                    date: new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                    rawDate: new Date(r.created_at),
                    status: r.status,
                    statusText: formatStatus(r.status),
                    image: r.image_url || '',
                    department: {
                        name: 'Public Works Department',
                        contact: 'help@pwd.gov',
                        phone: '12345 67899'
                    },
                    timeline: timeline,
                    repairPhotos: []
                };
            });
        }
    } catch (e) {
        console.error("Failed to load reports", e);
    }

    // Initialize filters
    initFilters();

    // Apply initial filter and render
    applyFilters();

    // Load preview images with auth
    loadPreviewImages();

    // Check if a report was selected from dashboard
    const selectedReportId = sessionStorage.getItem('selectedReportId');
    if (selectedReportId) {
        selectReport(selectedReportId);
        sessionStorage.removeItem('selectedReportId');
    }
}

/**
 * Load preview images using authenticated fetch, convert to blob URLs
 */
async function loadPreviewImages() {
    for (const report of allReportsData) {
        if (!report.image) continue;
        if (blobImageCache[report.image]) {
            report.blobUrl = blobImageCache[report.image];
            continue;
        }

        try {
            const res = await Auth.fetchWithAuth(report.image);
            if (res.ok) {
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                blobImageCache[report.image] = blobUrl;
                report.blobUrl = blobUrl;

                // Update any visible thumbnail immediately
                const imgEl = document.querySelector(`img[data-report-id="${report.id}"]`);
                if (imgEl) {
                    imgEl.src = blobUrl;
                    imgEl.style.display = 'block';
                    // Hide placeholder if it exists
                    const placeholder = imgEl.parentElement.querySelector('.preview-placeholder');
                    if (placeholder) placeholder.style.display = 'none';
                }
            }
        } catch (e) {
            console.warn(`Failed to load image for report ${report.id}`, e);
        }
    }
}

/**
 * Format status text for display
 */
function formatStatus(status) {
    const map = {
        'submitted': 'Pending',
        'approved': 'Approved',
        'assigned': 'Assigned',
        'in-progress': 'In Progress',
        'resolved': 'Fixed',
        'rejected': 'Rejected',
        'completed': 'Fixed'
    };
    return map[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get badge class for status
 */
function getBadgeClass(status) {
    const map = {
        'submitted': 'badge-reported',
        'approved': 'badge-inprogress',
        'assigned': 'badge-inprogress',
        'in-progress': 'badge-inprogress',
        'resolved': 'badge-completed',
        'completed': 'badge-completed',
        'rejected': 'badge-rejected'
    };
    return map[status] || 'badge-default';
}

/**
 * Get status dot color
 */
function getStatusDot(status) {
    const map = {
        'submitted': '#f59e0b',
        'approved': '#3b82f6',
        'assigned': '#3b82f6',
        'in-progress': '#22c55e',
        'resolved': '#22c55e',
        'completed': '#22c55e',
        'rejected': '#ef4444'
    };
    return map[status] || '#9ca3af';
}

/**
 * Initialize filter event listeners
 */
function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sortFilter = document.getElementById('sortFilter');

    searchInput.addEventListener('input', () => {
        currentPage = 1;
        applyFilters();
    });

    statusFilter.addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });

    sortFilter.addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
    });
}

/**
 * Apply search, filter, and sort
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const statusVal = document.getElementById('statusFilter').value;
    const sortVal = document.getElementById('sortFilter').value;

    // Filter
    filteredReports = allReportsData.filter(r => {
        // Search filter
        if (searchTerm) {
            const idMatch = String(r.id).toLowerCase().includes(searchTerm);
            const locMatch = r.location.toLowerCase().includes(searchTerm);
            if (!idMatch && !locMatch) return false;
        }

        // Status filter
        if (statusVal !== 'all') {
            if (r.status !== statusVal) return false;
        }

        return true;
    });

    // Sort
    filteredReports.sort((a, b) => {
        switch (sortVal) {
            case 'date-asc':
                return a.rawDate - b.rawDate;
            case 'id':
                return String(a.id).localeCompare(String(b.id));
            case 'date-desc':
            default:
                return b.rawDate - a.rawDate;
        }
    });

    renderAllReportsTable();
    renderPagination();
}

/**
 * Render all reports table with preview images
 */
function renderAllReportsTable() {
    const tbody = document.getElementById('allReportsTable');
    const totalFiltered = filteredReports.length;

    if (totalFiltered === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="table-empty">
                        <strong>No reports found</strong>
                        Try adjusting your search or filters.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Paginate
    const start = (currentPage - 1) * REPORTS_PER_PAGE;
    const end = Math.min(start + REPORTS_PER_PAGE, totalFiltered);
    const pageReports = filteredReports.slice(start, end);

    tbody.innerHTML = pageReports.map(report => {
        const dotColor = getStatusDot(report.status);
        const badgeClass = getBadgeClass(report.status);
        const blobUrl = report.blobUrl || blobImageCache[report.image] || '';
        const hasImage = blobUrl && blobUrl.length > 0;

        return `
            <tr>
                <td>
                    <div class="preview-thumb">
                        ${hasImage
                ? `<img src="${blobUrl}" alt="Report preview" class="preview-img" data-report-id="${report.id}">`
                : `<div class="preview-placeholder" data-report-id-ph="${report.id}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div><img src="" alt="Report preview" class="preview-img" data-report-id="${report.id}" style="display:none;">`
            }
                    </div>
                </td>
                <td><span class="report-id">#RD-${report.id}</span></td>
                <td><span class="report-location"><svg width="12" height="12" viewBox="0 0 24 24" fill="#3b82f6" stroke="none" style="vertical-align: -1px; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>${report.location}</span></td>
                <td><span class="report-date">${report.date}</span></td>
                <td><span class="badge ${badgeClass}"><span class="badge-dot" style="background:${dotColor};"></span>${report.statusText}</span></td>
                <td><a href="javascript:void(0)" class="view-details-link" onclick="selectReport('${report.id}')">View Details <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg></a></td>
            </tr>
        `;
    }).join('');
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const totalFiltered = filteredReports.length;
    const totalPages = Math.ceil(totalFiltered / REPORTS_PER_PAGE);
    const start = Math.min((currentPage - 1) * REPORTS_PER_PAGE + 1, totalFiltered);
    const end = Math.min(currentPage * REPORTS_PER_PAGE, totalFiltered);

    // Info text
    const infoEl = document.getElementById('paginationInfo');
    if (totalFiltered === 0) {
        infoEl.innerHTML = `No reports found`;
    } else {
        infoEl.innerHTML = `Showing <strong>${start}</strong> to <strong>${end}</strong> of <strong>${totalFiltered}</strong> reports`;
    }

    // Page buttons
    const controlsEl = document.getElementById('paginationControls');
    if (totalPages <= 1) {
        controlsEl.innerHTML = '';
        return;
    }

    let html = '';

    // Prev button
    html += `<button class="page-btn page-nav ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    // Next button
    html += `<button class="page-btn page-nav ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 6 15 12 9 18"></polyline></svg>
    </button>`;

    controlsEl.innerHTML = html;
}

/**
 * Go to specific page
 */
function goToPage(page) {
    const totalPages = Math.ceil(filteredReports.length / REPORTS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderAllReportsTable();
    renderPagination();

    // Scroll to top of table
    document.getElementById('reportsList').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Load report details
 */
function loadReportDetails() {
    if (!currentReport) return;

    // Toggle views
    document.getElementById('reportsList').style.display = 'none';
    document.getElementById('reportDetails').style.display = 'block';

    // Render timeline
    renderTimeline();

    // Hide old repair photos section
    const oldRepairSection = document.getElementById('repairPhotosSection');
    if (oldRepairSection) oldRepairSection.style.display = 'none';
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
    if (!deptInfo) return;
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
 * Close report details
 */
function closeReportDetails() {
    document.getElementById('reportDetails').style.display = 'none';
    document.getElementById('reportsList').style.display = 'block';
    currentReport = null;
}

/**
 * Select report by ID
 */
function selectReport(reportId) {
    currentReport = allReportsData.find(r => String(r.id) === String(reportId));
    if (currentReport) {
        loadReportDetails();
    } else {
        console.warn(`Report ${reportId} not found in loaded data`);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initTracking);
