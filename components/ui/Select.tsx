import React, { ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export type SelectItemType = SelectOption | SelectOptionGroup;

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "value" | "size"
> {
  options?: SelectItemType[];
  value?: string | string[];
  onChange?: any;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: boolean | string;
  icon?: ReactNode;
  multiple?: boolean;
  fullWidth?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  onSearchChange?: (val: string) => void;
  allowFreeText?: boolean;
  chipIcon?: ReactNode;
  size?: string;
}

const EMPTY_VALUE = "__empty_value__";

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select an option...",
      label,
      helperText,
      error,
      icon,
      multiple,
      fullWidth,
      searchable,
      clearable,
      loading,
      onSearchChange,
      allowFreeText,
      chipIcon,
      size,
      className = "",
      children,
      name,
      ...props
    },
    _ref,
  ) => {
    const errorMsg = typeof error === "string" ? error : undefined;
    const isError = error !== false && error !== undefined;
    const showHelper = errorMsg || helperText;

    // Extract options from children if not provided
    const parsedOptions: SelectItemType[] = options ? [...options] : [];
    if (!options && children) {
      React.Children.forEach(children, (child) => {
        if (!React.isValidElement<any>(child)) return;

        // Handle <optgroup>
        if (child.type === "optgroup") {
          const groupOptions: SelectOption[] = [];
          React.Children.forEach(child.props.children, (groupChild) => {
            if (
              React.isValidElement<any>(groupChild) &&
              groupChild.type === "option"
            ) {
              groupOptions.push({
                value: groupChild.props.value as string,
                label: groupChild.props.children,
                disabled: groupChild.props.disabled,
              });
            }
          });
          if (groupOptions.length > 0) {
            parsedOptions.push({
              label: child.props.label as string,
              options: groupOptions,
            });
          }
        }
        // Handle <option>
        else if (child.type === "option") {
          parsedOptions.push({
            value: child.props.value as string,
            label: child.props.children,
            disabled: child.props.disabled,
          });
        }
      });
    }

    const handleValueChange = (val: string) => {
      if (!onChange) return;
      const mappedVal = val === EMPTY_VALUE ? "" : val;
      // Synthetic event for FormSelect/GlassSelect compatibility
      const event = {
        target: { name: name || "", value: mappedVal },
        currentTarget: { name: name || "", value: mappedVal },
        preventDefault: () => {},
        stopPropagation: () => {},
      };

      onChange(event, mappedVal); // Pass both!
    };

    if (multiple) {
      return (
        <div className={`w-full ${className}`}>
          {label && (
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {label}
            </label>
          )}
          <select
            multiple
            value={value as string[]}
            onChange={(e) => {
              if (onChange) {
                // Return array of strings to maintain old Select behavior for multiple
                const vals = Array.from(
                  e.target.selectedOptions,
                  (opt) => opt.value,
                );
                onChange(vals, e); // Pass value first to appease ParallelReader!
              }
            }}
            className="w-full bg-(--glass-surface) border border-(--glass-outline) text-(--text-primary) rounded-md p-2 focus:ring-2 focus:ring-(--primary-resonance) outline-none"
            {...props}
          >
            {parsedOptions.map((opt, i) => {
              if ("options" in opt) {
                return (
                  <optgroup key={i} label={opt.label as string}>
                    {opt.options.map((subOpt) => (
                      <option
                        key={subOpt.value}
                        value={subOpt.value}
                        disabled={subOpt.disabled}
                      >
                        {subOpt.label}
                      </option>
                    ))}
                  </optgroup>
                );
              }
              return (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              );
            })}
          </select>
          {showHelper && (
            <p
              className={`text-xs mt-1 ${isError ? "text-red-500" : "text-(--text-muted)"}`}
            >
              {errorMsg || helperText}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <SelectPrimitive.Root
            value={value === "" ? EMPTY_VALUE : (value as string)}
            onValueChange={handleValueChange}
            disabled={props.disabled}
            name={name}
          >
            <SelectPrimitive.Trigger
              id={props.id || name}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm bg-transparent border rounded-md shadow-sm outline-none transition-colors 
                ${isError ? "border-red-500 text-red-500 hover:border-red-600" : "border-(--glass-outline) text-(--text-primary) hover:border-(--glass-border-hover,rgba(255,255,255,0.2))"}
                focus:ring-2 focus:ring-(--primary-resonance) disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <div className="flex items-center truncate">
                {icon && (
                  <span className="mr-2 text-(--text-muted)">{icon}</span>
                )}
                <SelectPrimitive.Value placeholder={placeholder} />
              </div>
              <SelectPrimitive.Icon asChild>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
              <SelectPrimitive.Content
                className="z-[9999] min-w-32 overflow-hidden rounded-md border border-(--glass-outline,rgba(255,255,255,0.1)) bg-(--glass-surface-solid,#1c1c1e) shadow-md animate-in fade-in-80 zoom-in-95"
                position="popper"
                sideOffset={4}
              >
                <SelectPrimitive.Viewport className="p-1">
                  {parsedOptions.map((opt, i) => {
                    if ("options" in opt) {
                      return (
                        <SelectPrimitive.Group key={i}>
                          <SelectPrimitive.Label className="px-3 py-1.5 text-xs font-semibold text-(--text-muted)">
                            {opt.label}
                          </SelectPrimitive.Label>
                          {opt.options.map((subOpt) => (
                            <SelectPrimitive.Item
                              key={
                                subOpt.value === "" ? EMPTY_VALUE : subOpt.value
                              }
                              value={
                                subOpt.value === "" ? EMPTY_VALUE : subOpt.value
                              }
                              disabled={subOpt.disabled}
                              className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-(--text-primary) outline-none focus:bg-(--primary-resonance) focus:text-white data-disabled:pointer-events-none data-disabled:opacity-50"
                            >
                              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                <SelectPrimitive.ItemIndicator>
                                  <Check className="h-4 w-4" />
                                </SelectPrimitive.ItemIndicator>
                              </span>
                              <SelectPrimitive.ItemText>
                                {subOpt.label}
                              </SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Group>
                      );
                    }
                    return (
                      <SelectPrimitive.Item
                        key={opt.value === "" ? EMPTY_VALUE : opt.value}
                        value={opt.value === "" ? EMPTY_VALUE : opt.value}
                        disabled={opt.disabled}
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-(--text-primary) outline-none focus:bg-(--primary-resonance) focus:text-white data-disabled:pointer-events-none data-disabled:opacity-50"
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          <SelectPrimitive.ItemIndicator>
                            <Check className="h-4 w-4" />
                          </SelectPrimitive.ItemIndicator>
                        </span>
                        <SelectPrimitive.ItemText>
                          {opt.label}
                        </SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    );
                  })}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
        {showHelper && (
          <p
            className={`text-xs mt-1 ${isError ? "text-red-500" : "text-(--text-muted)"}`}
          >
            {errorMsg || helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
