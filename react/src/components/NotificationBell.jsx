// components/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { Bell, X, Phone, MessageSquare, Calendar, DollarSign } from 'lucide-react';

const NotificationBell = ({ loans }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const generateNotifications = () => {
      const today = new Date();
      const notifs = [];

      loans?.forEach(loan => {
        const dueDate = new Date(loan.dueDate);
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 3 || daysDiff < 0) {
          let type = 'info';
          let message = '';
          
          if (daysDiff < 0) {
            type = 'danger';
            message = `Overdue by ${Math.abs(daysDiff)} days`;
          } else if (daysDiff === 0) {
            type = 'warning';
            message = 'Due today';
          } else if (daysDiff <= 3) {
            type = 'info';
            message = `Due in ${daysDiff} days`;
          }

          notifs.push({
            id: `notif-${loan.id}`,
            loanId: loan.id,
            customerName: loan.customerName,
            customerPhone: loan.customerPhone,
            type,
            message,
            dueDate: loan.dueDate,
            outstandingAmount: loan.outstandingAmount,
            isRead: false,
            timestamp: new Date()
          });
        }
      });

      notifs.sort((a, b) => {
        if (a.type === 'danger' && b.type !== 'danger') return -1;
        if (b.type === 'danger' && a.type !== 'danger') return 1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    };

    generateNotifications();
  }, [loans]);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSMS = (phone, customerName) => {
    const message = `Hello ${customerName}, this is a friendly reminder about your gold loan payment. Please contact us to discuss payment options.`;
    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Payment Alerts</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-400 mb-2">
                  <Bell size={32} className="mx-auto" />
                </div>
                <p className="text-gray-600">No pending notifications</p>
              </div>
            ) : (
              notifications.slice(0, 5).map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{notification.customerName}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          notification.type === 'danger' ? 'bg-red-100 text-red-800' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.message}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-medium">{notification.loanId}</span>
                          <span>•</span>
                          <span>₹{notification.outstandingAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Due: {notification.dueDate}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCall(notification.customerPhone)}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transition-colors"
                        >
                          <Phone size={10} />
                          Call
                        </button>
                        <button
                          onClick={() => handleSMS(notification.customerPhone, notification.customerName)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors"
                        >
                          <MessageSquare size={10} />
                          SMS
                        </button>
                      </div>
                    </div>
                    
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 5 && (
            <div className="p-3 border-t border-gray-100 text-center">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;