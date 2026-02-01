// Notifications Screen JavaScript

// Dummy notifications data
const notificationsData = [
    {
        id: 'NOTIF-001',
        title: 'Report Verified',
        message: 'Your report RPT-001 (Pothole on Main Street) has been verified and assigned to Public Works Department.',
        timestamp: '2024-01-15 2:15 PM',
        read: false,
        reportId: 'RPT-001',
        type: 'verification'
    },
    {
        id: 'NOTIF-002',
        title: 'Work Started',
        message: 'Repair work has started on your report RPT-001. Expected completion: 2-3 days.',
        timestamp: '2024-01-16 11:00 AM',
        read: false,
        reportId: 'RPT-001',
        type: 'progress'
    },
    {
        id: 'NOTIF-003',
        title: 'Report Completed',
        message: 'Your report RPT-003 (Severe Pothole) has been completed. View completion evidence in tracking.',
        timestamp: '2024-01-12 4:00 PM',
        read: true,
        reportId: 'RPT-003',
        type: 'completion'
    },
    {
        id: 'NOTIF-004',
        title: 'New Report Received',
        message: 'Thank you for reporting damage at Park Avenue. Your report RPT-002 is under review.',
        timestamp: '2024-01-14 3:45 PM',
        read: true,
        reportId: 'RPT-002',
        type: 'confirmation'
    },
    {
        id: 'NOTIF-005',
        title: 'Contractor Assigned',
        message: 'A contractor has been assigned to your report RPT-001. Work will begin shortly.',
        timestamp: '2024-01-16 9:00 AM',
        read: false,
        reportId: 'RPT-001',
        type: 'assignment'
    }
];

/**
 * Render notifications list
 */
function renderNotifications() {
    const container = document.getElementById('notificationsList');
    const emptyState = document.getElementById('emptyState');
    
    if (notificationsData.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    // Sort by timestamp (newest first)
    const sortedNotifications = [...notificationsData].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    container.innerHTML = sortedNotifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="openRelatedReport('${notif.reportId}')">
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-timestamp">🕐 ${notif.timestamp}</div>
            </div>
            <div class="notification-actions">
                ${!notif.read ? '<span class="status-chip status-pending">New</span>' : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Open related report
 */
function openRelatedReport(reportId) {
    // Mark notification as read
    const notification = notificationsData.find(n => n.reportId === reportId);
    if (notification) {
        notification.read = true;
    }
    
    // Navigate to tracking page with report selected
    sessionStorage.setItem('selectedReportId', reportId);
    window.location.href = 'tracking.html';
}

/**
 * Mark all notifications as read
 */
function markAllAsRead() {
    notificationsData.forEach(notif => {
        notif.read = true;
    });
    renderNotifications();
    showAlert('Notifications', 'All notifications marked as read.', 'success');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', renderNotifications);
