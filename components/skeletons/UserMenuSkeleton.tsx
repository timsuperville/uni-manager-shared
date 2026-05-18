import React from 'react';

const UserMenuSkeleton: React.FC = () => (
  <div className="flex items-center space-x-3 p-2 rounded-xl animate-pulse">
    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
    <div className="hidden md:block space-y-2">
      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  </div>
);

export default UserMenuSkeleton;
