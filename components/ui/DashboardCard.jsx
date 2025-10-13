import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from './Card';

const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  className = '',
  variant = 'elevated',
  interactive = false,
  onClick,
  loading = false,
  ...props
}) => {
  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400',
  };

  const handleClick = interactive && onClick ? onClick : undefined;

  return (
    <Card
      variant={variant}
      interactive={interactive}
      onClick={handleClick}
      className={`
        ${className}
        ${loading ? 'animate-pulse' : ''}
      `}
      {...props}
    >
      <CardContent padding='lg'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            {/* Title */}
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
              {title}
            </p>

            {/* Value */}
            <p className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1'>
              {loading ? (
                <span className='inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse'></span>
              ) : (
                value
              )}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                {subtitle}
              </p>
            )}

            {/* Trend */}
            {trend && trendLabel && (
              <div
                className={`flex items-center mt-2 text-xs ${trendColors[trend] || trendColors.neutral}`}
              >
                {trend === 'up' && (
                  <svg
                    className='w-3 h-3 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg
                    className='w-3 h-3 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                )}
                {trend === 'neutral' && (
                  <svg
                    className='w-3 h-3 mr-1'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                )}
                <span>{trendLabel}</span>
              </div>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div className='flex-shrink-0'>
              <div
                className='
                w-12 h-12 
                bg-gradient-to-br from-blue-50 to-blue-100 
                dark:from-blue-900/30 dark:to-blue-800/30 
                rounded-xl 
                flex items-center justify-center
                border border-blue-200 dark:border-blue-700/50
              '
              >
                <Icon className='w-6 h-6 text-blue-600 dark:text-blue-400' />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const StatCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <DashboardCard
      title={title}
      value={value}
      icon={Icon}
      trend={changeType}
      trendLabel={change}
      className={className}
      {...props}
    />
  );
};

const ActionCard = ({
  title,
  description,
  action,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <Card
      variant='outlined'
      interactive={true}
      className={`
        group 
        hover:border-blue-300 dark:hover:border-blue-600 
        transition-all duration-200 
        ${className}
      `}
      {...props}
    >
      <CardContent padding='lg'>
        <div className='flex items-start space-x-4'>
          {Icon && (
            <div
              className='
              w-10 h-10 
              bg-blue-50 dark:bg-blue-900/30 
              rounded-lg 
              flex items-center justify-center 
              group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 
              transition-colors duration-200
            '
            >
              <Icon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
            </div>
          )}
          <div className='flex-1 min-w-0'>
            <h3 className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-1'>
              {title}
            </h3>
            {description && (
              <p className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
                {description}
              </p>
            )}
            {action && (
              <div className='text-xs text-blue-600 dark:text-blue-400 font-medium'>
                {action}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  trendLabel: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'gradient']),
  interactive: PropTypes.bool,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.string,
  changeType: PropTypes.oneOf(['up', 'down', 'neutral']),
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

ActionCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.string,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

export { DashboardCard, StatCard, ActionCard };
export default DashboardCard;
