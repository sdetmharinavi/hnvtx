// components/diary/DiaryCalendar.tsx
'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DiaryCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  // THE FIX: Add onMonthChange prop
  onMonthChange: (date: Date) => void;
  highlightedDates: Date[];
}

export const DiaryCalendar = ({ selectedDate, onDateChange, onMonthChange, highlightedDates }: DiaryCalendarProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700 flex justify-center">
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => {
          if (date) onDateChange(date);
        }}
        // THE FIX: capture month navigation
        onMonthChange={(date: Date) => onMonthChange(date)}
        onYearChange={(date: Date) => onMonthChange(date)} 
        inline
        highlightDates={highlightedDates}
        className="react-datepicker-custom"
      />
    </div>
  );
};