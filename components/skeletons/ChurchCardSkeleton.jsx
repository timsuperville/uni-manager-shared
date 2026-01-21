import React from "react";

const ChurchCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col h-full dark:bg-gray-800 dark:border-gray-700 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className="h-6 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
          {/* Denomination */}
          <div className="h-4 bg-gray-200 rounded w-1/3 dark:bg-gray-700"></div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 mb-4 flex-1">
        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700"></div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 pt-2">
          <div className="w-4 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-2">
        <div className="h-10 bg-gray-200 rounded-lg w-full dark:bg-gray-700"></div>
      </div>
    </div>
  );
};

export default ChurchCardSkeleton;
