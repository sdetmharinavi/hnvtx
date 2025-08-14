interface DetailItemProps {
    label: string;
    value: string | null | undefined;
  }
  
  export function DetailItem({ label, value }: DetailItemProps) {
    if (!value) return null;
    return (
      <div>
        <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>{label}</label>
        <p className='text-gray-900 dark:text-white mt-1'>
          <span>{value}</span>
        </p>
      </div>
    );
  }