// Report Damage Screen JavaScript

let selectedFile = null;
let detectionResult = null;

document.addEventListener('DOMContentLoaded', () => {
    Auth.requireRole('citizen');
    initReportForm();
});

/**
 * Initialize the report damage form
 */
function initReportForm() {
    const locationDisplay = document.getElementById('locationDisplay');

    // GPS LOCATION (MANDATORY)
    if ("geolocation" in navigator) {
        locationDisplay.textContent = "Acquiring GPS...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                locationDisplay.textContent =
                    `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
                locationDisplay.dataset.lat = latitude;
                locationDisplay.dataset.lng = longitude;
            },
            () => {
                locationDisplay.textContent = "Location permission REQUIRED";
                locationDisplay.dataset.lat = "";
                locationDisplay.dataset.lng = "";
                showAlert(
                    "Location Required",
                    "Please enable GPS to submit a damage report.",
                    "warning"
                );
            }
        );
    } else {
        locationDisplay.textContent = "Geolocation not supported";
    }

    // Timestamp
    document.getElementById('timestampDisplay').textContent =
        new Date().toLocaleString();

    // Upload area click
    document.getElementById('uploadArea').addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && !selectedFile) {
            triggerFileInput();
        }
    });
}

function triggerFileInput() {
    document.getElementById('fileInput').click();
}

/**
 * Handle file selection
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    selectedFile = file;

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        preview.src = e.target.result;
        preview.style.display = 'block';

        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('uploadActions').style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Ensure location exists
    const locDisplay = document.getElementById('locationDisplay');
    if (!locDisplay.dataset.lat || !locDisplay.dataset.lng) {
        showAlert("Location Required", "Enable GPS before uploading image.", "error");
        return;
    }

    // Run ML detection
    await runDetection();
}

/**
 * Run ML detection BEFORE submit
 */
async function runDetection() {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = "Analyzing Image...";

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
        const res = await fetch("/api/citizen/detect", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Auth.getToken()}`
            },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "Detection failed");

        detectionResult = data;

        showAlert(
            "Detection Result",
            `Detected Damage: ${data.damage_type}
Confidence: ${(data.confidence * 100).toFixed(1)}%`,
            "info"
        );

        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Report";

    } catch (err) {
        console.error(err);
        showAlert("Detection Error", err.message, "error");
        submitBtn.disabled = true;
        submitBtn.textContent = "Submit Report";
    }
}

function retakePhoto() {
    selectedFile = null;
    detectionResult = null;

    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('uploadActions').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('submitBtn').disabled = true;
}

/**
 * FINAL SUBMIT
 */
async function submitReport() {
    if (!selectedFile || !detectionResult) {
        showAlert(
            "Incomplete",
            "Please upload image and wait for detection.",
            "warning"
        );
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const locDisplay = document.getElementById('locationDisplay');

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("description",
        document.getElementById('descriptionInput').value
    );
    formData.append("location", locDisplay.textContent);
    formData.append("latitude", locDisplay.dataset.lat);
    formData.append("longitude", locDisplay.dataset.lng);

    try {
        const res = await fetch("/api/citizen/submit", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Auth.getToken()}`
            },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "Submission failed");

        showAlert(
            "Report Submitted",
            `Report ID: ${data.report_id}`,
            "success",
            () => window.location.href = "dashboard.html"
        );

    } catch (err) {
        console.error(err);
        showAlert("Error", err.message, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Report";
    }
}

// Global exposure
window.triggerFileInput = triggerFileInput;
window.handleFileSelect = handleFileSelect;
window.retakePhoto = retakePhoto;
window.submitReport = submitReport;
