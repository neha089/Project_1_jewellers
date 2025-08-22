// hooks/useNotifications.js
import { useState, useEffect } from 'react';

export const useNotifications = (loans) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const generateNotifications = () => {
      const today = new Date();
      const notifs = [];

      loans.forEach(loan => {
        const dueDate = new Date(loan.dueDate);
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        // Generate notifications for loans due within 7 days or overdue
        if (daysDiff <= 7 || daysDiff < 0) {
          let type = 'info';
          let priority = 'low';
          let message = '';
          let action = 'reminder';

          if (daysDiff < 0) {
            type = 'danger';
            priority = 'high';
            message = `Payment overdue by ${Math.abs(daysDiff)} days`;
            action = 'remind';
          } else if (daysDiff <= 3) {
            type = 'info';
            priority = 'medium';
            message = `Payment due in ${daysDiff} days`;
            action = 'remind';
          } else {
            type = 'info';
            priority = 'low';
            message = `Payment due in ${daysDiff} days`;
            action = 'reminder';
          }

          notifs.push({
            id: `notif-${loan.id}`,
            loanId: loan.id,
            customerId: loan.customerId,
            customerName: loan.customerName,
            customerPhone: loan.customerPhone,
            type,
            priority,
            message,
            action,
            dueDate: loan.dueDate,
            outstandingAmount: loan.outstandingAmount,
            daysDiff,
            goldItem: loan.goldItem,
            isRead: false,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Sort notifications by priority and due date
      notifs.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.daysDiff - b.daysDiff;
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    };

    if (loans.length > 0) {
      generateNotifications();
    }
  }, [loans]);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === id);
      return notification && !notification.isRead ? prev - 1 : prev;
    });
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification
  };
}
