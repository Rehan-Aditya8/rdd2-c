// Work Monitoring Screen JavaScript

// Data fetched from API
let workOrdersData = [];
let currentWork = null;
let currentReport = null;

/**
 * Initialize monitoring page
 */
async function initMonitoring() {
    Auth.requireRole('official');

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        window.location.href = 'dashboard.html';
        return;
    }

    await fetchWorkOrders();
    await fetchReportDetails(id);

    // Try to find matching work order
    currentWork = workOrdersData.find(w => w.id === id || w.reportId === id);

    if (currentWork || currentReport) {
        if (currentWork) {
            // Internal hidden selector for compatibility with legacy functions if any
            const selector = document.getElementById('workSelector');
            if (selector) {
                selector.innerHTML = `<option value="${currentWork.id}">${currentWork.id}</option>`;
                selector.value = currentWork.id;
            }
        }
        loadWorkDetails();
    } else {
        // Fallback
        document.getElementById('activeWorksList').style.display = 'block';
        renderActiveWorks();
    }
}

async function fetchReportDetails(id) {
    try {
        const response = await Auth.fetchWithAuth(`/api/official/reports/${id}`);
        if (response.ok) {
            currentReport = await response.json();
        }
    } catch (e) {
        console.error("Fetch Report Error", e);
    }
}

async function fetchWorkOrders() {
    try {
        const response = await Auth.fetchWithAuth('/api/official/work-reports');
        if (response.ok) {
            const data = await response.json();
            // Transform
            workOrdersData = data.map(r => ({
                id: r.id,
                reportId: r.id, // Using Work ID as report ID ref for now
                location: r.location,
                contractor: (r.contractor && r.contractor.name) || 'Not Assigned',
                status: r.status === 'resolved' ? 'completed' : (r.status === 'assigned' ? 'in-progress' : 'pending'),
                statusText: r.status === 'assigned' ? 'In Progress' : (r.status === 'verified' ? 'Pending' : r.status),
                assignedDate: r.created_at,
                expectedCompletion: 'TBD',
                beforePhoto: 'https://via.placeholder.com/600x400/cccccc/ffffff?text=No+Image',
                afterPhoto: null,
                logs: []
            }));
        }
    } catch (e) {
        console.error("Fetch Error", e);
    }
}

/**
 * Load work details
 */
function loadWorkDetails() {
    // Show work details section
    document.getElementById('workDetails').style.display = 'block';
    document.getElementById('activeWorksList').style.display = 'none';

    // Render timeline
    renderTimeline();

    // Render status indicator
    renderStatusIndicator();

    // Render photos
    renderPhotos();

    // Render logs
    renderLogs();

    // Show/hide mark completed button
    if (currentWork && currentWork.status === 'in-progress') {
        document.getElementById('markCompletedBtn').style.display = 'inline-block';
    } else {
        document.getElementById('markCompletedBtn').style.display = 'none';
    }
}

/**
 * Render status timeline
 */
function renderTimeline() {
    const timelineContainer = document.getElementById('statusTimeline');
    if (!timelineContainer || !currentReport) return;

    const steps = ['submitted', 'approved', 'assigned', 'in-progress', 'resolved'];
    const labels = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Completed'];

    let currentStageIndex = steps.indexOf(currentReport.status);
    if (currentStageIndex === -1) {
        if (currentReport.status === 'verified' || currentReport.status === 'approved') currentStageIndex = 1;
        else if (currentReport.status === 'assigned') currentStageIndex = 2;
        else if (currentReport.status === 'in-progress') currentStageIndex = 3;
        else if (currentReport.status === 'resolved') currentStageIndex = 4;
        else if (currentReport.status === 'rejected') currentStageIndex = 0;
        else currentStageIndex = 0;
    }

    const timelineData = labels.map((label, idx) => ({
        step: label,
        date: idx <= currentStageIndex ? (idx === 0 ? new Date(currentReport.created_at).toLocaleString() : (idx === currentStageIndex ? 'Current' : 'Done')) : null,
        completed: idx < currentStageIndex,
        active: idx === currentStageIndex
    }));

    timelineContainer.innerHTML = timelineData.map((item, index) => {
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
 * Render status indicator
 */
function renderStatusIndicator() {
    const indicator = document.getElementById('workStatusIndicator');
    if (!indicator) return;

    if (currentWork) {
        indicator.innerHTML = `
            <div class="status-badge status-${currentWork.status}">${currentWork.statusText}</div>
            <div style="margin-top: 1rem;">
                <p><strong>Work Order ID:</strong> ${currentWork.id}</p>
                <p><strong>Report ID:</strong> ${currentWork.reportId}</p>
                <p><strong>Contractor:</strong> ${currentWork.contractor}</p>
                <p><strong>Assigned Date:</strong> ${currentWork.assignedDate}</p>
                <p><strong>Expected Completion:</strong> ${currentWork.expectedCompletion}</p>
            </div>
        `;
    } else if (currentReport) {
        const statusText = currentReport.status.charAt(0).toUpperCase() + currentReport.status.slice(1);
        const statusClass = ['in-progress', 'assigned'].includes(currentReport.status) ? 'in-progress' :
            (currentReport.status === 'resolved' ? 'completed' : 'pending');

        indicator.innerHTML = `
            <div class="status-badge status-${statusClass}">${statusText}</div>
            <div style="margin-top: 1rem;">
                <p><strong>Report ID:</strong> ${currentReport.id}</p>
                <p><strong>Location:</strong> ${currentReport.location}</p>
                <p><strong>Status:</strong> ${statusText}</p>
            </div>
        `;
    }
}

/**
 * Render photos
 */
function renderPhotos() {
    if (currentWork) {
        document.getElementById('beforePhoto').src = currentWork.beforePhoto;
        if (currentWork.afterPhoto) {
            document.getElementById('afterPhoto').src = currentWork.afterPhoto;
        } else {
            document.getElementById('afterPhoto').src = 'https://via.placeholder.com/600x400/cccccc/666666?text=Not+Available+Yet';
        }
    } else if (currentReport) {
        document.getElementById('beforePhoto').src = currentReport.image_url;
        document.getElementById('afterPhoto').src = 'https://via.placeholder.com/600x400/cccccc/666666?text=Not+Available+Yet';
    }
}

/**
 * Render logs
 */
function renderLogs() {
    const container = document.getElementById('logsContainer');
    if (!container) return;

    if (currentWork && currentWork.logs && currentWork.logs.length > 0) {
        container.innerHTML = currentWork.logs.map(log => `
            <div class="log-entry">
                <div class="log-entry-header">
                    <span>🕐 ${log.timestamp}</span>
                    <span>📍 ${log.location}</span>
                </div>
                <div class="log-entry-details">
                    <strong>Action:</strong> ${log.action}<br>
                    <strong>Contractor:</strong> ${log.contractor}
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p style="color: #999; text-align: center;">No logs available for this work order.</p>';
    }
}

/**
 * Render active works grid
 */
function renderActiveWorks() {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;

    if (workOrdersData.length === 0) {
        grid.innerHTML = '<p style="color: #999; grid-column: 1/-1; text-align: center;">No active work orders found.</p>';
        return;
    }

    grid.innerHTML = workOrdersData.map(work => `
        <div class="work-card" onclick="selectWork('${work.id}')">
            <div class="work-card-header">
                <div class="work-card-title">${work.id}</div>
                <span class="status-chip status-${work.status}">${work.statusText}</span>
            </div>
            <div class="work-card-meta">
                <strong>Report:</strong> ${work.reportId}<br>
                <strong>Location:</strong> ${work.location}<br>
                <strong>Contractor:</strong> ${work.contractor}<br>
                <strong>Expected:</strong> ${work.expectedCompletion}
            </div>
        </div>
    `).join('');
}

/**
 * Select work from grid
 */
function selectWork(workId) {
    window.location.href = `monitoring.html?id=${workId}`;
}

/**
 * Mark work as completed
 */
function markCompleted() {
    if (!currentWork) return;

    showConfirm('Confirm Completion', `Mark work order ${currentWork.id} as completed?`, () => {
        showAlert('Work Completed', `Work order ${currentWork.id} has been marked as completed.\n\nRedirecting to dashboard...`, 'success', () => {
            window.location.href = 'dashboard.html';
        });
    });
}

/**
 * Flag issue
 */
function flagIssue() {
    if (!currentWork) return;

    showPrompt('Flag Issue', 'Please describe the issue:', 'Enter issue description...', (reason) => {
        if (reason) {
            showAlert('Issue Flagged', `Issue flagged for work order ${currentWork.id}.\n\nReason: ${reason}\n\nThis will be reviewed by the supervisor.`, 'warning');
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initMonitoring);
