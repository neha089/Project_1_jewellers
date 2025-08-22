// components/DueDateCalendar.jsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Phone, DollarSign, AlertTriangle } from 'lucide-react';

const DueDateCalendar = ({ loans, onLoanClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getLoansForDate = (day) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = targetDate.toISOString().split('T')[0];
    
    return loans.filter(loan => loan.dueDate === dateString);
  };

  const getDayStatus = (day) => {
    const loansForDay = getLoansForDate(day);
    if (loansForDay.length === 0) return 'normal';
    
    const hasOverdue = loansForDay.some(loan => loan.status === 'overdue');
    const hasActive = loansForDay.some(loan => loan.status === 'active');
    
    if (hasOverdue) return 'overdue';
    if (hasActive) return 'due';
    return 'normal';
  };

  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Payment Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-medium text-gray-900 min-w-[140px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Due Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Upcoming</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {/* Empty cells for days before month starts */}
        {emptyDays.map(day => (
          <div key={`empty-${day}`} className="h-20 border border-gray-100"></div>
        ))}
        
        {/* Days of the month */}
        {days.map(day => {
          const loansForDay = getLoansForDate(day);
          const dayStatus = getDayStatus(day);
          const isToday = isCurrentMonth && day === today.getDate();
          
          return (
            <div
              key={day}
              className={`h-20 border border-gray-100 p-1 relative cursor-pointer hover:bg-gray-50 transition-colors ${
                isToday ? 'ring-2 ring-blue-500 ring-inset' : ''
              }`}
              onClick={() => loansForDay.length > 0 && onLoanClick && onLoanClick(loansForDay)}
            >
              <div className="flex justify-between items-start h-full">
                <span className={`text-sm font-medium ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day}
                </span>
                
                {loansForDay.length > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-1 py-0.5 rounded-full ${
                      dayStatus === 'overdue' ? 'bg-red-500 text-white' :
                      dayStatus === 'due' ? 'bg-yellow-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {loansForDay.length}
                    </span>
                    
                    {/* Show total amount for the day */}
                    <span className="text-xs text-gray-600">
                      ₹{(loansForDay.reduce((sum, loan) => sum + loan.outstandingAmount, 0) / 1000).toFixed(0)}K
                    </span>
                  </div>
                )}
              </div>
              
              {/* Indicator dots for loan status */}
              {loansForDay.length > 0 && (
                <div className="absolute bottom-1 left-1 flex gap-1">
                  {loansForDay.slice(0, 3).map((loan, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full ${
                        loan.status === 'overdue' ? 'bg-red-500' :
                        loan.status === 'active' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                    />
                  ))}
                  {loansForDay.length > 3 && (
                    <div className="text-xs text-gray-500">+{loansForDay.length - 3}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DueDateCalendar;