// Unified Report Damage Screen JavaScript
// Handles: Realtime Camera Detection (Live Detection Only)

// =====================================================
// SHARED STATE
// =====================================================
let selectedFile = null;
let currentMode = null; // 'camera' only now
let detectionData = null; // Holds last detection { damage_type, confidence, annotated_image }

// Shared GPS state
let gpsData = { lat: null, lng: null, locationText: 'Acquiring location...' };

// Realtime Camera State
let rtStream = null;
let rtIsRunning = false;
let rtInterval = null;
let rtCanvas = null;
let rtCtx = null;
let rtCurrentFacingMode = 'environment';

// Track best detection to prevent fluctuation
let bestDetection = null; // { damage_type, confidence, annotated_image }

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    Auth.requireRole('citizen');
    initGPS();
    initUIControls();

    rtCanvas = document.createElement('canvas');
});

// =====================================================
// GPS HANDLING
// =====================================================
function initGPS() {
    const latDisplay = document.getElementById('gpsLatDisplay');
    const lngDisplay = document.getElementById('gpsLngDisplay');
    const statusText = document.querySelector('.gps-status');

    function updateGPSUI() {
        if (gpsData.lat !== null) {
            latDisplay.textContent = gpsData.lat.toFixed(5);
            lngDisplay.textContent = gpsData.lng.toFixed(5);
            if (statusText) statusText.textContent = "GPS ACTIVE";
        } else {
            latDisplay.textContent = "--";
            lngDisplay.textContent = "--";
            if (statusText) statusText.textContent = "SEARCHING...";
        }
    }

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                gpsData.lat = latitude;
                gpsData.lng = longitude;
                gpsData.locationText = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
                updateGPSUI();
            },
            (error) => {
                gpsData.locationText = 'Location permission REQUIRED';
                if (statusText) statusText.textContent = "GPS DISABLED";
                showAlert("Location Required", "Please enable GPS and allow precise location.", "warning");
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    } else {
        gpsData.locationText = 'Geolocation not supported';
        if (statusText) statusText.textContent = "GPS UNAVAILABLE";
    }
}

// =====================================================
// UI CONTROLS INIT
// =====================================================
function initUIControls() {
    // 1. Camera Controls
    document.getElementById('rtStartBtn').addEventListener('click', () => {
        startRealtime();
    });

    document.getElementById('rtStopBtn').addEventListener('click', stopRealtime);
    document.getElementById('rtSwitchBtn').addEventListener('click', switchCamera);

    // 2. Severity Toggle
    const sevBtns = document.querySelectorAll('.sev-btn');
    sevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sevBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 3. Form Actions
    document.getElementById('cancelReportBtn').addEventListener('click', resetForm);
    document.getElementById('rtSubmitBtn').addEventListener('click', submitReport);
}

function updateSeverity(confidence) {
    const sevBtns = document.querySelectorAll('.sev-btn');
    sevBtns.forEach(b => b.classList.remove('active'));

    let sevId = 'sevLow';
    if (confidence >= 0.8) sevId = 'sevHigh';
    else if (confidence >= 0.5) sevId = 'sevMedium';

    document.getElementById(sevId).classList.add('active');
}

function updateStatusCards(damageType, confidence) {
    document.getElementById('detectionIdValue').textContent = "Pending Submit";
    document.getElementById('aiConfidenceValue').textContent = damageType === 'No Damage' ? '--' : `${(confidence * 100).toFixed(1)}% Match`;
    document.getElementById('statusValue').textContent = damageType === 'No Damage' ? 'Ready to send' : 'Damage Detected';
}

function resetForm() {
    selectedFile = null;
    currentMode = null;
    detectionData = null;
    bestDetection = null;

    if (rtIsRunning) stopRealtime();

    document.getElementById('damageTypeSelect').value = '';
    const sevBtns = document.querySelectorAll('.sev-btn');
    sevBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('sevMedium').classList.add('active'); // default

    document.getElementById('rtDescriptionInput').value = '';
    document.getElementById('rtSubmitStatus').style.display = 'none';

    document.getElementById('detectionIdValue').textContent = '--';
    document.getElementById('aiConfidenceValue').textContent = '--';
    document.getElementById('statusValue').textContent = 'Ready to send';

    document.getElementById('rtSubmitBtn').disabled = false;
    document.getElementById('rtSubmitBtn').innerHTML = `Submit Report <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
}

// =====================================================
// CAMERA / REALTIME PROCESS
// =====================================================
async function startRealtime(facingMode) {
    if (facingMode) rtCurrentFacingMode = facingMode;

    // Reset best detection when starting new session
    bestDetection = null;

    try {
        rtStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: { ideal: rtCurrentFacingMode } },
            audio: false
        });
    } catch (err) {
        showAlert("Camera Error", "Could not access webcam. Please grant camera permission.", "error");
        return;
    }

    currentMode = 'camera';

    const webcamContainer = document.getElementById('webcamContainer');
    const video = document.getElementById('webcamVideo');
    video.srcObject = rtStream;
    webcamContainer.style.display = 'block';

    document.getElementById('rtStopBtn').style.display = 'inline-flex';
    document.getElementById('rtSwitchBtn').style.display = 'inline-flex';
    document.getElementById('detectionOverlay').style.display = 'block';

    document.getElementById('statusValue').textContent = 'Camera Active';

    rtIsRunning = true;

    // Wait for video to be ready then start polling
    video.onloadedmetadata = () => {
        rtCanvas.width = video.videoWidth;
        rtCanvas.height = video.videoHeight;
        rtCtx = rtCanvas.getContext('2d');
        rtInterval = setInterval(sendRealtimeFrame, 1000); // every 1 second
    };
}

function stopRealtime() {
    rtIsRunning = false;

    if (rtInterval) {
        clearInterval(rtInterval);
        rtInterval = null;
    }

    if (rtStream) {
        rtStream.getTracks().forEach(t => t.stop());
        rtStream = null;
    }

    const video = document.getElementById('webcamVideo');
    video.srcObject = null;

    document.getElementById('webcamContainer').style.display = 'none';
    document.getElementById('rtStopBtn').style.display = 'none';
    document.getElementById('rtSwitchBtn').style.display = 'none';
    document.getElementById('detectionOverlay').style.display = 'none';

    // --- FINALIZE: Lock in the best detection values ---
    if (bestDetection && bestDetection.damage_type && bestDetection.damage_type !== 'No Damage') {
        detectionData = bestDetection;

        // Set damage type dropdown
        const select = document.getElementById('damageTypeSelect');
        const normalizedType = normalizeDamageType(bestDetection.damage_type);
        if (normalizedType) {
            select.value = normalizedType;
        }

        // Set severity based on final best confidence
        updateSeverity(bestDetection.confidence);

        // Set status cards with final values
        updateStatusCards(bestDetection.damage_type, bestDetection.confidence);

        document.getElementById('statusValue').textContent = 'Detection Complete';
    } else {
        document.getElementById('statusValue').textContent = 'No Damage Found';
        currentMode = null;
    }
}

// Normalize damage type from API to match dropdown options
function normalizeDamageType(apiType) {
    if (!apiType) return null;
    const lower = apiType.toLowerCase().replace(/[_-]/g, ' ').trim();

    const mappings = {
        'longitudinal crack': 'Longitudinal Crack',
        'longitudinal': 'Longitudinal Crack',
        'transverse crack': 'Transverse Crack',
        'transverse': 'Transverse Crack',
        'alligator crack': 'Alligator Crack',
        'alligator': 'Alligator Crack',
        'pothole': 'Pothole',
        'potholes': 'Pothole',
        'd00': 'Longitudinal Crack',
        'd10': 'Transverse Crack',
        'd20': 'Alligator Crack',
        'd40': 'Pothole',
    };

    if (mappings[lower]) return mappings[lower];

    // Fuzzy match: try partial matching
    for (const [key, value] of Object.entries(mappings)) {
        if (lower.includes(key) || key.includes(lower)) {
            return value;
        }
    }

    // Direct match attempt against dropdown options
    const select = document.getElementById('damageTypeSelect');
    const found = Array.from(select.options).find(opt =>
        opt.value.toLowerCase() === lower || opt.value === apiType
    );
    return found ? found.value : null;
}

async function switchCamera() {
    rtCurrentFacingMode = rtCurrentFacingMode === 'environment' ? 'user' : 'environment';
    if (rtInterval) { clearInterval(rtInterval); rtInterval = null; }
    if (rtStream) { rtStream.getTracks().forEach(t => t.stop()); rtStream = null; }

    try {
        rtStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: { ideal: rtCurrentFacingMode } },
            audio: false
        });
        const video = document.getElementById('webcamVideo');
        video.srcObject = rtStream;
        video.onloadedmetadata = () => {
            rtCanvas.width = video.videoWidth;
            rtCanvas.height = video.videoHeight;
            rtCtx = rtCanvas.getContext('2d');
            rtInterval = setInterval(sendRealtimeFrame, 1000);
        };
    } catch (err) {
        console.error(err);
        rtCurrentFacingMode = rtCurrentFacingMode === 'environment' ? 'user' : 'environment';
    }
}

async function sendRealtimeFrame() {
    if (!rtIsRunning) return;

    const video = document.getElementById('webcamVideo');
    if (video.readyState < 2) return;

    rtCtx.drawImage(video, 0, 0, rtCanvas.width, rtCanvas.height);
    const frameData = rtCanvas.toDataURL('image/jpeg', 0.7);

    try {
        const res = await fetch("/api/citizen/detect-frame", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Auth.getToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                frame: frameData,
                location: gpsData.locationText,
                latitude: gpsData.lat,
                longitude: gpsData.lng
            })
        });

        const data = await res.json();
        if (!res.ok) return;

        // Update the live overlay (this is fine to keep updating while camera runs)
        updateRealtimeOverlay(data);

        // Track the best (highest confidence) detection
        if (data.detected && data.damage_type && data.damage_type !== 'No Damage') {
            if (!bestDetection || data.confidence > bestDetection.confidence) {
                bestDetection = {
                    damage_type: data.damage_type,
                    confidence: data.confidence,
                    annotated_image: data.annotated_image || null
                };
            }
        }

    } catch (err) {
        console.warn("Realtime frame error:", err);
    }
}

function updateRealtimeOverlay(data) {
    const overlay = document.getElementById('detectionOverlay');
    if (data.detected && data.damage_type) {
        overlay.innerHTML = `<span class="detection-label">${data.damage_type} &nbsp; ${(data.confidence * 100).toFixed(0)}%</span>`;
    } else {
        overlay.innerHTML = `<span class="detection-label no-damage">✓ No Damage</span>`;
    }
    overlay.style.display = 'block';
}

// =====================================================
// SUBMIT REPORT
// =====================================================
async function submitReport() {
    if (!currentMode) {
        showAlert("Incomplete", "Please start camera detection first.", "warning");
        return;
    }

    const typeSelect = document.getElementById('damageTypeSelect').value;
    if (!typeSelect) {
        showAlert("Incomplete", "Please select a Damage Type.", "warning");
        return;
    }

    const btn = document.getElementById('rtSubmitBtn');
    const status = document.getElementById('rtSubmitStatus');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    status.style.display = 'none';

    // Which severity is selected?
    const activeSev = document.querySelector('.sev-btn.active');
    const severity = activeSev ? activeSev.getAttribute('data-severity').toLowerCase() : 'medium';
    const desc = document.getElementById('rtDescriptionInput').value.trim();

    try {
        let res, data;

        if (currentMode === 'camera') {
            if (!detectionData) throw new Error("No damage detected to submit yet.");

            const formData = new FormData();
            formData.append('damage_type', typeSelect);

            let subConf = (detectionData.damage_type === typeSelect) ? detectionData.confidence : (severity === 'high' ? 0.8 : 0.5);
            formData.append('confidence', subConf);

            formData.append('location', gpsData.locationText || '');
            if (gpsData.lat !== null) {
                formData.append('latitude', gpsData.lat);
                formData.append('longitude', gpsData.lng);
            }
            if (desc) formData.append('description', desc);
            if (detectionData.annotated_image) {
                formData.append('frame_b64', detectionData.annotated_image);
            }

            res = await fetch('/api/citizen/submit-realtime-frame', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` },
                body: formData
            });
        }

        data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Submit failed');

        btn.innerHTML = `✅ Submitted`;
        status.textContent = `Report #${data.report_id} saved successfully!`;
        status.style.color = '#22c55e';
        status.style.display = 'block';

        document.getElementById('detectionIdValue').textContent = `#${data.report_id}`;
        document.getElementById('statusValue').textContent = "Submitted";

        if (rtIsRunning) stopRealtime();

    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = `Submit Report <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
        status.textContent = 'Error: ' + err.message;
        status.style.color = '#ef4444';
        status.style.display = 'block';
    }
}
