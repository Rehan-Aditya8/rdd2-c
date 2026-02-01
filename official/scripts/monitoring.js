// Work Monitoring Screen JavaScript

// Dummy work orders data
const workOrdersData = [
    {
        id: 'WO-001',
        reportId: 'RPT-001',
        location: 'Main Street, Block 5',
        contractor: 'ABC Road Construction Co.',
        status: 'in-progress',
        statusText: 'In Progress',
        assignedDate: '2024-01-16',
        expectedCompletion: '2024-01-19',
        beforePhoto: 'https://via.placeholder.com/600x400/667eea/ffffff?text=Before+Repair',
        afterPhoto: 'https://via.placeholder.com/600x400/28a745/ffffff?text=After+Repair',
        logs: [
            { timestamp: '2024-01-16 9:00 AM', location: '28.6139, 77.2090', action: 'Work started', contractor: 'ABC Road Construction Co.' },
            { timestamp: '2024-01-16 11:30 AM', location: '28.6139, 77.2090', action: 'Materials delivered', contractor: 'ABC Road Construction Co.' },
            { timestamp: '2024-01-16 2:00 PM', location: '28.6139, 77.2090', action: 'Excavation completed', contractor: 'ABC Road Construction Co.' }
        ]
    },
    {
        id: 'WO-002',
        reportId: 'RPT-005',
        location: 'Elm Avenue, Block 12',
        contractor: 'QuickFix Contractors',
        status: 'in-progress',
        statusText: 'In Progress',
        assignedDate: '2024-01-11',
        expectedCompletion: '2024-01-14',
        beforePhoto: 'https://via.placeholder.com/600x400/764ba2/ffffff?text=Before+Repair',
        afterPhoto: null,
        logs: [
            { timestamp: '2024-01-11 10:00 AM', location: '28.6200, 77.2150', action: 'Work started', contractor: 'QuickFix Contractors' },
            { timestamp: '2024-01-11 1:00 PM', location: '28.6200, 77.2150', action: 'Site assessment completed', contractor: 'QuickFix Contractors' }
        ]
    },
    {
        id: 'WO-003',
        reportId: 'RPT-007',
        location: 'Cedar Lane, Block 8',
        contractor: 'ABC Road Construction Co.',
        status: 'in-progress',
        statusText: 'In Progress',
        assignedDate: '2024-01-09',
        expectedCompletion: '2024-01-12',
        beforePhoto: 'https://via.placeholder.com/600x400/dc3545/ffffff?text=Before+Repair',
        afterPhoto: null,
        logs: [
            { timestamp: '2024-01-09 8:00 AM', location: '28.6250, 77.2200', action: 'Work started', contractor: 'ABC Road Construction Co.' },
            { timestamp: '2024-01-09 12:00 PM', location: '28.6250, 77.2200', action: 'Initial preparation done', contractor: 'ABC Road Construction Co.' }
        ]
    }
];

let currentWork = null;

/**
 * Initialize monitoring page
 */
function initMonitoring() {
    populateWorkSelector();
    renderActiveWorks();
}

/**
 * Populate work selector
 */
function populateWorkSelector() {
    const selector = document.getElementById('workSelector');
    workOrdersData.forEach(work => {
        const option = document.createElement('option');
        option.value = work.id;
        option.textContent = `${work.id} - ${work.location} (${work.statusText})`;
        selector.appendChild(option);
    });
}

/**
 * Load work details
 */
function loadWorkDetails() {
    const workId = document.getElementById('workSelector').value;
    if (!workId) {
        document.getElementById('workDetails').style.display = 'none';
        return;
    }
    
    currentWork = workOrdersData.find(w => w.id === workId);
    if (!currentWork) return;
    
    // Show work details section
    document.getElementById('workDetails').style.display = 'block';
    
    // Render status indicator
    renderStatusIndicator();
    
    // Render photos
    renderPhotos();
    
    // Render logs
    renderLogs();
    
    // Show/hide mark completed button
    if (currentWork.status === 'in-progress') {
        document.getElementById('markCompletedBtn').style.display = 'inline-block';
    } else {
        document.getElementById('markCompletedBtn').style.display = 'none';
    }
}

/**
 * Render status indicator
 */
function renderStatusIndicator() {
    const indicator = document.getElementById('workStatusIndicator');
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
}

/**
 * Render photos
 */
function renderPhotos() {
    document.getElementById('beforePhoto').src = currentWork.beforePhoto;
    
    if (currentWork.afterPhoto) {
        document.getElementById('afterPhoto').src = currentWork.afterPhoto;
    } else {
        document.getElementById('afterPhoto').src = 'https://via.placeholder.com/600x400/cccccc/666666?text=Not+Available+Yet';
    }
}

/**
 * Render logs
 */
function renderLogs() {
    const container = document.getElementById('logsContainer');
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
}

/**
 * Render active works grid
 */
function renderActiveWorks() {
    const grid = document.getElementById('worksGrid');
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
    document.getElementById('workSelector').value = workId;
    loadWorkDetails();
    document.getElementById('workSelector').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Mark work as completed
 */
function markCompleted() {
    if (!currentWork) return;
    
    showConfirm('Confirm Completion', `Mark work order ${currentWork.id} as completed?`, () => {
        // In a real app, send completion to backend
        showAlert('Work Completed', `Work order ${currentWork.id} has been marked as completed.\n\nRedirecting to dashboard...`, 'success', () => {
            // Update status
            currentWork.status = 'completed';
            currentWork.statusText = 'Completed';
            
            // Redirect to dashboard
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
