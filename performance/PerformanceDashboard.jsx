import React from "react";
import { useWebVitals } from "../webVitals";

export const PerformanceDashboard = ({ className = "" }) => {
  const { metrics, score } = useWebVitals();

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getMetricColor = (rating) => {
    switch (rating) {
      case "good":
        return "text-green-600";
      case "needs-improvement":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null; // Only show in development
  }

  return (
    <div
      className={
        "fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 " +
        className
      }
    >
      <h3 className="font-bold text-sm mb-2">Performance Monitor</h3>

      <div className="mb-2">
        <div className="text-xs text-gray-600">Overall Score</div>
        <div className={"text-lg font-bold " + getScoreColor(score)}>
          {score.toFixed(0)}/100
        </div>
      </div>

      <div className="space-y-1">
        {Object.entries(metrics).map(([name, metric]) => (
          <div key={name} className="flex justify-between text-xs">
            <span>{name}</span>
            <span className={getMetricColor(metric.rating)}>
              {typeof metric.value === "number"
                ? metric.value.toFixed(0)
                : metric.value}
              {name === "CLS" ? "" : "ms"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
