import React from "react";
import PropTypes from "prop-types";
import { MapPin, Users, Calendar, ChevronRight, Heart } from "lucide-react";

/**
 * ChurchCard Component
 *
 * Shared component for displaying church details in lists/grids.
 * Used by DiscoveryFeed and ChurchSearch.
 */
const ChurchCard = ({
  church,
  onVisit,
  onJoin,
  loading = false,
  showActions = true,
}) => {
  const {
    name,
    churchName, // Handle inconsistent naming
    denomination,
    address,
    memberCount,
    description,
    userMembership,
    createdAt,
    distance,
    isVisiting,
    hasPendingRequest,
  } = church;

  const displayName = name || churchName || "Unknown Church";
  const isMember = !!userMembership;
  const memberRole = userMembership?.role;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const renderActions = () => {
    if (!showActions) return null;

    // 1. Visiting State (From Onboarding)
    if (isVisiting) {
      return (
        <button
          disabled
          className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2 dark:bg-green-900/30 dark:text-green-400"
        >
          <Heart className="w-4 h-4 fill-current" />
          <span>Visiting</span>
        </button>
      );
    }

    // 2. Pending Request State (From Onboarding)
    if (hasPendingRequest) {
      return (
        <button
          disabled
          className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium dark:bg-gray-700 dark:text-gray-400"
        >
          Pending...
        </button>
      );
    }

    // 3. Member State (From Discovery)
    if (isMember) {
      return (
        <button
          onClick={() => onVisit && onVisit(church)}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:bg-purple-400"
        >
          <span>View Details</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      );
    }

    // 4. Default / Discovery Actions
    return (
      <div className="flex gap-3">
        {onVisit && (
          <button
            onClick={() => onVisit(church)}
            disabled={loading}
            className={`flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:bg-purple-400 ${!onJoin ? "w-full" : ""}`}
          >
            <span>Visit</span>
            {onJoin && <ChevronRight className="w-4 h-4" />}
          </button>
        )}

        {onJoin && (
          <button
            onClick={() => onJoin(church)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <span>Join</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1 dark:text-white line-clamp-1">
            {displayName}
          </h3>
          {denomination && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {denomination}
            </p>
          )}
        </div>

        {isMember && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium dark:bg-purple-900/50 dark:text-purple-300 whitespace-nowrap ml-2">
            {memberRole}
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4 flex-1">
        {description && (
          <p className="text-sm text-gray-700 line-clamp-2 mb-3 dark:text-gray-300">
            {description}
          </p>
        )}

        {address && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {address.city}, {address.state || address.country}
            </span>
            {distance && (
              <span className="text-purple-600 font-medium dark:text-purple-400">
                · {distance.toFixed(1)} mi
              </span>
            )}
          </div>
        )}

        {memberCount !== undefined && memberCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{memberCount} members</span>
          </div>
        )}

        {createdAt && !isVisiting && !hasPendingRequest && (
          // Only show established date if not in the specific onboarding/visiting context where it might clutter
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>Joined {formatDate(createdAt)}</span>
          </div>
        )}
      </div>

      <div className="mt-auto">{renderActions()}</div>
    </div>
  );
};

ChurchCard.propTypes = {
  church: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    churchName: PropTypes.string,
    denomination: PropTypes.string,
    description: PropTypes.string,
    address: PropTypes.shape({
      city: PropTypes.string,
      state: PropTypes.string,
      country: PropTypes.string,
    }),
    memberCount: PropTypes.number,
    userMembership: PropTypes.shape({
      role: PropTypes.string,
    }),
    createdAt: PropTypes.string,
    distance: PropTypes.number,
    isVisiting: PropTypes.bool,
    hasPendingRequest: PropTypes.bool,
  }).isRequired,
  onVisit: PropTypes.func,
  onJoin: PropTypes.func,
  loading: PropTypes.bool,
  showActions: PropTypes.bool,
};

export default ChurchCard;
