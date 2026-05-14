// app/dashboard/diary/page.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import { FiBookOpen, FiCalendar, FiPrinter } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay, Button } from '@/components/common/ui';
import { DiaryEntryCard } from '@/components/diary/DiaryEntryCard';
import { DiaryCalendar } from '@/components/diary/DiaryCalendar';
import { useDiaryData } from '@/hooks/data/useDiaryData';
import { GenericFilterBar } from '@/components/common/filters/GenericFilterBar'; 

type ViewMode = 'day' | 'feed';

export default function DiaryPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const[viewMode, setViewMode] = useState<ViewMode>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebounce(searchQuery, 300);

  const {
    data: allNotesForMonth =[],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDiaryData(currentDate);

  const filteredNotes = useMemo(() => {
    let notes = allNotesForMonth;

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      notes = notes.filter(
        (note) =>
          (note.content?.toLowerCase() || '').includes(query) ||
          (note.tags && note.tags.some((tag: string) => tag.toLowerCase().includes(query))),
      );
    }

    if (viewMode === 'day' && !debouncedSearch) {
      const selectedDateString = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1,
      ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      notes = notes.filter((note) => note.note_date === selectedDateString);
    }

    return notes;
  },[allNotesForMonth, debouncedSearch, viewMode, selectedDate]);

  const highlightedDates = useMemo(() => {
    return (allNotesForMonth ||[]).map((note) => {
      const [y, m, d] = note.note_date!.split('-').map(Number);
      return new Date(y, m - 1, d);
    });
  },[allNotesForMonth]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
    if (
      date.getMonth() !== currentDate.getMonth() ||
      date.getFullYear() !== currentDate.getFullYear()
    ) {
      setCurrentDate(date);
    }
  };

  const handleMonthChange = useCallback((date: Date) => {
    setCurrentDate(date);
  },[]);

  const jumpToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentDate(now);
    setViewMode('day');
  };

  const headerActions = useStandardHeaderActions({
    data: allNotesForMonth,
    onRefresh: refetch,
    isLoading,
    isFetching: isFetching,
    exportConfig: { tableName: 'diary_notes', fileName: 'diary_logs' },
  });

  const handlePrintFeed = () => {
    window.print();
  };

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  const selectedDateString = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode === 'grid' ? 'day' : 'feed');
  };
  const genericViewMode = viewMode === 'day' ? 'grid' : 'table';

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
      <div className='mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <div className='mb-6'>
          <PageHeader
            title='Log Book Viewer'
            description='View daily maintenance logs and event tracking.'
            icon={<FiBookOpen />}
            stats={[{ value: allNotesForMonth.length, label: 'Total This Month' }]}
            actions={headerActions}
            isLoading={isLoading}
            isFetching={isFetching}
          />
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-12 gap-6'>
          {/* Calendar Sidebar */}
          <div className='xl:col-span-4 space-y-6'>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative'>
              <div className='p-4'>
                <DiaryCalendar
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  onMonthChange={handleMonthChange}
                  highlightedDates={highlightedDates}
                />
              </div>
              <div className='absolute top-4 right-4 z-20'>
                <Button size='xs' variant='ghost' onClick={jumpToToday} title='Jump to Today'>
                  Today
                </Button>
              </div>
            </div>

            <div className='hidden xl:block bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800'>
              <h4 className='font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2'>
                <FiCalendar /> Usage Tips
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Use the calendar to filter entries by specific dates. Switch to "Feed"
                view to see all activities for the current month in chronological order.
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className='xl:col-span-8 space-y-6'>
            <GenericFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder='Search logs or tags...'
              filters={{}} 
              onFilterChange={() => {}}
              filterConfigs={[]} 
              viewMode={genericViewMode}
              onViewModeChange={handleViewModeChange}
              extraActions={
                viewMode === 'feed' ? (
                  <Button size='sm' variant='outline' onClick={handlePrintFeed} leftIcon={<FiPrinter className='w-4 h-4' />} title="Print this month's feed">
                    Print
                  </Button>
                ) : null
              }
            />

            <div className={viewMode === 'feed' ? 'printable-content' : ''}>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                  {debouncedSearch ? (
                    <>Search Results ({filteredNotes.length})</>
                  ) : viewMode === 'day' ? (
                    <>{selectedDateString}</>
                  ) : (
                    <>Activity Feed for {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</>
                  )}
                </h2>
                {!debouncedSearch && viewMode === 'day' && (
                  <span className='text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full'>
                    {filteredNotes.length} entries
                  </span>
                )}
              </div>

              {filteredNotes.length === 0 ? (
                <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
                  <div className='text-center py-12 px-4'>
                    <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4'>
                      <FiBookOpen className='h-8 w-8 text-blue-400' />
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                      {debouncedSearch ? 'No matching notes found' : 'No entries found'}
                    </h3>
                  </div>
                </div>
              ) : (
                <div className='grid gap-4'>
                  {filteredNotes.map((note) => (
                    <DiaryEntryCard
                      key={note.id}
                      entry={note}
                      onEdit={() => {}} // Disabled
                      onDelete={() => {}} // Disabled
                      canEdit={false}
                      canDelete={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}