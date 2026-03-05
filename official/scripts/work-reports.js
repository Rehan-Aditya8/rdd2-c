// =====================================================
// OFFICIAL AUTH GUARD
// =====================================================
Auth.requireRole('official');

// =====================================================
// STATE
// =====================================================
let workReports = [];
let currentReports = [];
let locationMap = null;
let locationMapMarker = null;

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupDropZone();
    setupLocationSearch();
    initLocationMapUI();
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
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;"><div class="spinner"></div> Loading reports...</td></tr>`;

    try {
        const response = await Auth.fetchWithAuth('/api/official/work-reports');

        if (!response.ok) throw new Error('Failed to fetch reports');

        workReports = await response.json();
        currentReports = [...workReports];
        renderTable();
    } catch (error) {
        console.error('Error loading reports:', error);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:red;">Error: ${error.message}</td></tr>`;
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
                <td colspan="9" style="text-align:center;padding:2rem;">
                    No notices found
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = currentReports.map(report => `
        <tr>
            <td><strong>${report.notice_id || '-'}</strong></td>
            <td>${report.location || '-'}</td>
            <td>${report.department || '-'}</td>
            <td>${report.work_type || '-'}</td>
            <td>${new Date(report.created_at).toLocaleDateString()}</td>
            <td>-</td>        <!-- Traffic Div (not applicable) -->
            <td>-</td>        <!-- Severity (not applicable) -->
            <td>${report.status}</td>
            <td>
                <button class="btn btn-primary btn-sm"
                    onclick="openSidePanel('${report.id}')">
                    View
                </button>
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
    window.location.href = `verification.html?id=${reportId}`;
}

// =====================================================
// SIDE PANEL (SAFE)
// =====================================================
function openSidePanel(reportId) {
    const report = workReports.find(r => r.id === reportId);
    if (!report) return;

    document.getElementById('panelContent').innerHTML = `
        <p><strong>Notice ID:</strong> ${report.notice_id || report.id}</p>
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
// LOCATION SEARCH (NOMINATIM AUTOCOMPLETE)
// =====================================================
function setupLocationSearch() {
    const input = document.getElementById('locationSearchInput');
    const resultsEl = document.getElementById('locationSearchResults');

    if (!input || !resultsEl) return;

    let debounceTimer = null;

    input.addEventListener('input', () => {
        const query = input.value.trim();
        clearTimeout(debounceTimer);

        if (!query) {
            resultsEl.style.display = 'none';
            resultsEl.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => {
            fetchLocationSuggestions(query);
        }, 400);
    });
}

async function fetchLocationSuggestions(query) {
    const resultsEl = document.getElementById('locationSearchResults');
    if (!resultsEl) return;

    resultsEl.style.display = 'block';
    resultsEl.innerHTML = '<div class="location-search-item"><span class="location-search-item-text-main">Searching...</span></div>';

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
        const res = await fetch(url, {
            headers: {
                'Accept-Language': 'en'
            }
        });

        if (!res.ok) {
            resultsEl.innerHTML = '<div class="location-search-item"><span class="location-search-item-text-main">No results found</span></div>';
            return;
        }

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            resultsEl.innerHTML = '<div class="location-search-item"><span class="location-search-item-text-main">No results found</span></div>';
            return;
        }

        resultsEl.innerHTML = data.map(item => {
            const full = item.display_name || '';
            const parts = full.split(',');
            const main = (parts[0] || '').trim();
            const sub = parts.slice(1).join(',').trim();
            const safeMain = main.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeSub = sub.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeFull = full.replace(/"/g, '&quot;');

            return `<div class="location-search-item" data-full="${safeFull}" data-lat="${item.lat}" data-lon="${item.lon}">
                        <span class="location-search-item-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                                <circle cx="12" cy="10" r="3" />
                                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                            </svg>
                        </span>
                        <div>
                            <div class="location-search-item-text-main">${safeMain}</div>
                            ${safeSub ? `<div class="location-search-item-text-sub">${safeSub}</div>` : ''}
                        </div>
                    </div>`;
        }).join('');

        Array.from(resultsEl.querySelectorAll('.location-search-item')).forEach(el => {
            el.addEventListener('click', () => {
                const full = el.getAttribute('data-full') || '';
                const input = document.getElementById('locationSearchInput');
                if (input) input.value = full;
                resultsEl.style.display = 'none';
                const latStr = el.getAttribute('data-lat') || '';
                const lonStr = el.getAttribute('data-lon') || '';
                const lat = parseFloat(latStr);
                const lon = parseFloat(lonStr);
                if (!isNaN(lat) && !isNaN(lon)) {
                    handleLocationSelected(lat, lon, full);
                }
            });
        });
    } catch (e) {
        console.error('Location search error:', e);
        resultsEl.innerHTML = '<div class="location-search-item"><span class="location-search-item-text-main">Error searching location</span></div>';
    }
}


// =====================================================
// LOCATION MAP UI
// =====================================================
function initLocationMapUI() {
    const mapContainer = document.getElementById('locationMapContainer');
    const submitBtn = document.getElementById('locationSubmitBtn');
    if (mapContainer) {
        mapContainer.style.display = 'none';
    }
    if (submitBtn) {
        submitBtn.style.display = 'none';
        submitBtn.addEventListener('click', () => {
            const input = document.getElementById('locationSearchInput');
            const value = input ? input.value.trim() : '';
            if (!value) {
                showModal('Location Required', 'Please select a location before submitting.');
                return;
            }
            showModal('Location Selected', 'The location has been selected for this work notice.');
        });
    }
}

function handleLocationSelected(lat, lon) {
    const mapContainer = document.getElementById('locationMapContainer');
    const submitBtn = document.getElementById('locationSubmitBtn');

    if (mapContainer) {
        mapContainer.style.display = 'block';
    }
    if (submitBtn) {
        submitBtn.style.display = 'block';
    }

    showLocationOnMap(lat, lon);
}

function showLocationOnMap(lat, lon) {
    const mapEl = document.getElementById('locationMap');
    if (!mapEl || typeof L === 'undefined') {
        return;
    }

    const coords = [lat, lon];

    if (!locationMap) {
        locationMap = L.map('locationMap', {
            zoomControl: true,
            attributionControl: false
        }).setView(coords, 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(locationMap);
    } else {
        locationMap.setView(coords, 16);
    }

    if (locationMapMarker) {
        locationMapMarker.setLatLng(coords);
    } else {
        locationMapMarker = L.marker(coords).addTo(locationMap);
    }

    setTimeout(() => {
        if (locationMap) {
            locationMap.invalidateSize();
        }
    }, 150);
}


// =====================================================
// EXPORT GLOBALS
// =====================================================
window.goToVerification = goToVerification;
window.openSidePanel = openSidePanel;
window.closeSidePanel = closeSidePanel;
window.clearFilters = clearFilters;
window.downloadNotice = downloadNotice;

