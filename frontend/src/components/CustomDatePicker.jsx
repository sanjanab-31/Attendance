import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Calendar as CalendarIcon } from "lucide-react";

export default function CustomDatePicker({ selectedDate, onChange, onPrevDay, onNextDay }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(selectedDate));
  
  useEffect(() => {
    setCurrentMonthDate(new Date(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    const [y, m, d] = dateString.split("-");
    return `${d}-${m}-${y}`;
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day) => {
    const d = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d - tzOffset)).toISOString().split('T')[0];
    
    onChange(localISOTime);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelectedSafe = selectedDate === dateStr;
      const isToday = dateStr === new Date().toISOString().split("T")[0];

      days.push(
        <button
          key={d}
          onClick={() => handleSelectDate(d)}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-colors
            ${isSelectedSafe 
              ? 'bg-primary text-primary-dark' 
              : isToday 
                ? 'bg-slate-100 text-primary-dark border border-slate-200' 
                : 'text-slate-600 hover:bg-slate-100'
            }
          `}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 w-72">
        <div className="flex justify-between items-center mb-4">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-primary-dark text-sm">
            {currentMonthDate.toLocaleString('default', { month: 'long' })} {year}
          </div>
          <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="w-8 h-8 flex items-center justify-center text-[10px] font-bold text-slate-400">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center bg-white border border-slate-200 hover:border-primary transition-colors rounded-lg shadow-sm" ref={dropdownRef}>
      <button onClick={onPrevDay} className="p-2.5 hover:bg-primary/10 text-slate-400 hover:text-primary-dark transition-colors border-r border-slate-200">
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-dark hover:bg-slate-50 transition-colors h-full"
        >
          <CalendarDays className="w-4 h-4 text-primary" />
          {formatDate(selectedDate)}
          <CalendarIcon className="w-4 h-4 text-slate-300 hidden sm:block" />
        </button>
        {isOpen && renderCalendar()}
      </div>

      <button onClick={onNextDay} className="p-2.5 hover:bg-primary/10 text-slate-400 hover:text-primary-dark transition-colors border-l border-slate-200">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
