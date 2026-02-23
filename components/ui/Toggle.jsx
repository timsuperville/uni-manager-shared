import PropTypes from "prop-types";

/**
 * Toggle — Liquid Glass Design System
 *
 * Accessible toggle switch using CSS custom properties.
 * Active state colour is driven by `--primary-resonance` so each app's
 * brand colour is applied automatically.
 *
 * @param {boolean}  checked   - Whether the toggle is on
 * @param {function} onChange  - Called with new boolean value: onChange(bool)
 * @param {string}   label     - Optional text label rendered next to the toggle
 * @param {boolean}  disabled  - Disables interaction
 * @param {string}   className - Extra classes for the wrapper label element
 */
export function Toggle({
  checked = false,
  onChange,
  label,
  disabled = false,
  className = "",
  ...props
}) {
  const handleClick = () => {
    if (!disabled && onChange) onChange(!checked);
  };

  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled && onChange) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <label
      className={`flex items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      {...props}
    >
      <span
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKey}
        style={{
          display: "inline-block",
          width: 36,
          height: 20,
          borderRadius: 10,
          background: checked
            ? "var(--primary-resonance, var(--color-primary, #6366f1))"
            : "var(--glass-outline, var(--glass-border, rgba(255,255,255,0.12)))",
          position: "relative",
          transition: "background 0.2s",
          cursor: disabled ? "not-allowed" : "pointer",
          flexShrink: 0,
          outline: "none",
          border: "1px solid var(--glass-outline, rgba(255,255,255,0.1))",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 17 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </span>
      {label && (
        <span
          style={{
            fontSize: "var(--text-sm, 0.875rem)",
            color: "var(--text-primary, inherit)",
            userSelect: "none",
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
}

Toggle.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Toggle;
