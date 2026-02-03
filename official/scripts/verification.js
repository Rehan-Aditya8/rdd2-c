// =====================================================
// LEAFLET MAP CONFIG
// =====================================================
let mapInstance = null;


// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    Auth.requireRole('official');

    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('id');

    if (!reportId) {
        showModal(
            'Invalid Access',
            'Please select a report from Work Reports to verify.'
        );
        setTimeout(() => {
            window.location.href = 'work-reports.html';
        }, 1200);
        return;
    }

    window.currentReportId = reportId;
    loadReport();
});

// =====================================================
// LOAD REPORT DATA
// =====================================================
async function loadReport() {
    try {
        const response = await Auth.fetchWithAuth(
            `/api/official/reports/${window.currentReportId}`
        );

        if (!response.ok) {
            throw new Error('Failed to load report');
        }

        const report = await response.json();
        populateReport(report);

    } catch (error) {
        console.error(error);
        showModal('Error', error.message);
    }
}

// =====================================================
// LOAD MAP WITH MARKER (LEAFLET + OSM)
// =====================================================
function loadMap(lat, lng) {

    if (mapInstance) return; // prevent re-init

    document.getElementById('mapCoords').textContent =
        `Lat: ${lat}, Lng: ${lng}`;

    mapInstance = L.map('map', {
        zoomControl: true,     //✅ shows + / − buttons
        dragging: true,        // allow pan
        scrollWheelZoom: false // optional
    }).setView([lat, lng], 15);



    // OpenStreetMap tiles (FREE)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Marker
    L.marker([lat, lng])
        .addTo(mapInstance)
        .bindPopup('Reported Damage Location');

    // OPTIONAL POLISH
    mapInstance.setMinZoom(10);
    mapInstance.setMaxZoom(18);

    // Fix layout render issues
    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 100);
}


// =====================================================
// POPULATE UI
// =====================================================
async function populateReport(report) {

    // IMAGE (SECURE FETCH)
    const img = document.getElementById('reportImage');

    if (report.image_url) {
        try {
            const response = await Auth.fetchWithAuth(report.image_url);
            if (response.ok) {
                const blob = await response.blob();
                img.src = URL.createObjectURL(blob);
                img.style.display = 'block';
            }
        } catch (err) {
            console.error('Image load failed');
        }
    }

    // AI RESULT
    document.getElementById('aiResult').innerHTML = `
        <div class="ai-result-item">
            <strong>Damage Type:</strong> ${report.damage_type || 'N/A'}
        </div>
        <div class="ai-result-item">
            <strong>Confidence:</strong>
            ${report.confidence !== null
            ? (report.confidence * 100).toFixed(2) + '%'
            : 'N/A'}
        </div>
        <div class="ai-result-item">
            <strong>Severity:</strong> ${report.severity || 'N/A'}
        </div>
    `;

    // LOCATION + MAP
    if (report.latitude != null && report.longitude != null) {
        loadMap(report.latitude, report.longitude);
    } else {
        document.getElementById('mapCoords').textContent =
            'Location not available';
    }


    // REPORT INFO
    document.getElementById('reportInfo').innerHTML = `
        <div class="report-info-item"><strong>Report ID:</strong> ${report.id}</div>
        <div class="report-info-item"><strong>Reported By:</strong> ${report.reported_by || 'Citizen'}</div>
        <div class="report-info-item"><strong>Date:</strong> ${new Date(report.created_at).toLocaleString()}</div>
        <div class="report-info-item"><strong>Status:</strong> ${report.status}</div>
    `;
}

// =====================================================
// VERIFY ACTIONS
// =====================================================
async function submitVerification(status) {
    const reason = document.getElementById('reasonInput').value.trim();

    if (!reason) {
        showModal('Reason Required', 'Please provide a reason');
        return;
    }

    try {
        const response = await Auth.fetchWithAuth(
            `/api/official/reports/${window.currentReportId}/verify`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reason })
            }
        );

        if (!response.ok) {
            throw new Error('Verification failed');
        }

        showModal('Success', `Report ${status} successfully`, 'success');

        setTimeout(() => {
            window.location.href = 'work-reports.html';
        }, 1500);

    } catch (error) {
        console.error(error);
        showModal('Error', error.message);
    }
}

function approveReport() {
    submitVerification('approved');
}

function rejectReport() {
    submitVerification('rejected');
}

// EXPOSE
window.approveReport = approveReport;
window.rejectReport = rejectReport;
