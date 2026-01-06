import React from 'react';
import PropTypes from 'prop-types';
import { Card } from './Card';

/**
 * QuickActionCard - Displays quick action with icon, title, description, and button
 * Refactored to use Card and Button primitives
 */
export function QuickActionCard({ title, description, icon, action, color = 'blue', actionText = 'Get Started' }) {
    const colorConfig = {
        blue: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' },
        green: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-200' },
        purple: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-200' },
        orange: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200' },
    };

    const colors = colorConfig[color] || colorConfig.blue;

    return (
        <Card hover className={`${colors.light} border ${colors.border}`} padding="lg">
            <div className="flex items-start space-x-4">
                <div className={`${colors.bg} rounded-lg p-3 flex-shrink-0`}>
                    <span className="text-white text-xl">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-medium ${colors.text} mb-1`}>{title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{description}</p>
                    <button
                        onClick={action}
                        className={`${colors.bg} hover:${colors.bg.replace('500', '600')} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors`}
                    >
                        {actionText}
                    </button>
                </div>
            </div>
        </Card>
    );
}

QuickActionCard.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    action: PropTypes.func.isRequired,
    color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange']),
    actionText: PropTypes.string,
};

/**
 * ProgressCard - Displays progress towards a goal with progress bar
 * Refactored to use Card and ProgressBar primitives
 */
export function ProgressCard({ title, progress, target, unit, description, color = 'blue' }) {
    const percentage = target > 0 ? Math.min((progress / target) * 100, 100) : 0;

    const colorConfig = {
        blue: { text: 'text-blue-600', light: 'bg-blue-50' },
        green: { text: 'text-green-600', light: 'bg-green-50' },
        purple: { text: 'text-purple-600', light: 'bg-purple-50' },
        orange: { text: 'text-orange-600', light: 'bg-orange-50' },
    };

    const colors = colorConfig[color] || colorConfig.blue;

    return (
        <Card className={colors.light} padding="lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-medium ${colors.text}`}>{title}</h3>
                <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{progress} {unit}</span>
                    <span>{target} {unit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {description && <p className="text-sm text-gray-600">{description}</p>}
        </Card>
    );
}

ProgressCard.propTypes = {
    title: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    target: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired,
    description: PropTypes.string,
    color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange']),
};
