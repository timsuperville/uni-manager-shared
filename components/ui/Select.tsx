import React, { ReactNode } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

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

export interface SelectChangeEvent {
  target: { name: string; value: string };
  currentTarget: { name: string; value: string };
  preventDefault: () => void;
  stopPropagation: () => void;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value' | 'size'
> {
  options?: SelectItemType[];
  value?: string | string[];
  onChange?: (
    e: SelectChangeEvent | React.ChangeEvent<HTMLSelectElement> | string[],
    val?: string | React.ChangeEvent<HTMLSelectElement>
  ) => void;
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

const EMPTY_VALUE = '__empty_value__';

const getSizeClasses = (size?: string): string => {
  if (size === 'sm') return 'h-8 px-3 py-1.5 text-xs';
  if (size === 'lg') return 'h-10 px-4 py-3 text-base';
  return 'h-9 px-3 py-2 text-sm';
};

const extractStringValue = (label: ReactNode): ReactNode => {
  if (
    label &&
    typeof label === 'object' &&
    !React.isValidElement(label) &&
    !Array.isArray(label)
  ) {
    const obj = label as unknown as Record<string, unknown>;
    if ('label' in obj && typeof obj.label === 'string') return obj.label;
    if ('value' in obj && typeof obj.value === 'string') return obj.value;
    return JSON.stringify(label);
  }
  return label;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option...',
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
      className = '',
      children,
      name,
      ...props
    },
    _ref
  ) => {
    const errorMsg = typeof error === 'string' ? error : undefined;
    const isError = error !== false && error !== undefined;
    const showHelper = errorMsg || helperText;

    // Extract options from children if not provided
    const parsedOptions: SelectItemType[] = options ? [...options] : [];
    if (!options && children) {
      React.Children.forEach(children, child => {
        if (!React.isValidElement(child)) return;

        // Handle <optgroup>
        if (child.type === 'optgroup') {
          const groupOptions: SelectOption[] = [];
          React.Children.forEach(child.props.children, groupChild => {
            if (
              React.isValidElement(groupChild) &&
              groupChild.type === 'option'
            ) {
              const element = groupChild as React.ReactElement<{
                value?: string;
                disabled?: boolean;
                children?: ReactNode;
              }>;
              groupOptions.push({
                value: element.props.value as string,
                label: element.props.children,
                disabled: element.props.disabled
              });
            }
          });
          if (groupOptions.length > 0) {
            parsedOptions.push({
              label: child.props.label as string,
              options: groupOptions
            });
          }
        }
        // Handle <option>
        else if (child.type === 'option') {
          const element = child as React.ReactElement<{
            value?: string;
            disabled?: boolean;
            children?: ReactNode;
          }>;
          parsedOptions.push({
            value: element.props.value as string,
            label: element.props.children,
            disabled: element.props.disabled
          });
        }
      });
    }

    const handleValueChange = (val: string) => {
      if (!onChange) return;
      const mappedVal = val === EMPTY_VALUE ? '' : val;
      // Synthetic event for FormSelect/GlassSelect compatibility
      const event = {
        target: { name: name || '', value: mappedVal },
        currentTarget: { name: name || '', value: mappedVal },
        preventDefault: () => {},
        stopPropagation: () => {}
      };

      onChange(event, mappedVal); // Pass both!
    };

    const uniqueId = React.useId();
    const selectId = props.id || name || uniqueId;

    if (multiple) {
      return (
        <div className={className ? className : 'w-full'}>
          {label && (
            <label
              htmlFor={selectId}
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
            </label>
          )}
          <select
            id={selectId}
            multiple
            value={value as string[]}
            onChange={e => {
              if (onChange) {
                // Return array of strings to maintain old Select behavior for multiple
                const vals = Array.from(
                  e.target.selectedOptions,
                  opt => opt.value
                );
                onChange(vals, e); // Pass value first to appease ParallelReader!
              }
            }}
            className={`w-full lg-input ${isError ? 'lg-input-error' : ''} px-3 py-2 text-sm`}
            {...props}
          >
            {parsedOptions.map((opt, i) => {
              if ('options' in opt) {
                return (
                  <optgroup key={i} label={opt.label as string}>
                    {opt.options.map((subOpt, subIdx) => {
                      return (
                        <option
                          key={
                            subOpt.value === ''
                              ? `empty-${i}-${subIdx}`
                              : `${subOpt.value}-${i}-${subIdx}`
                          }
                          value={subOpt.value}
                          disabled={subOpt.disabled}
                        >
                          {extractStringValue(subOpt.label) as string}
                        </option>
                      );
                    })}
                  </optgroup>
                );
              }
              return (
                <option
                  key={opt.value === '' ? `empty-${i}` : `${opt.value}-${i}`}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {extractStringValue(opt.label) as string}
                </option>
              );
            })}
          </select>
          {showHelper && (
            <p
              className={`text-xs mt-1 ${isError ? 'text-red-500' : 'text-[var(--text-muted)]'}`}
            >
              {errorMsg || helperText}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className={className ? className : 'w-full'}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <SelectPrimitive.Root
            value={value === '' ? EMPTY_VALUE : (value as string)}
            onValueChange={handleValueChange}
            disabled={props.disabled}
            name={name}
            autoComplete={props.autoComplete}
          >
            <SelectPrimitive.Trigger
              id={selectId}
              aria-label={props['aria-label']}
              className={`flex items-center justify-between w-full lg-input ${
                isError ? 'lg-input-error' : ''
              } shadow-sm disabled:cursor-not-allowed ${getSizeClasses(size)} ${className}`}
            >
              <div className="flex-1 min-w-0 flex items-center justify-start text-left pr-2">
                {icon && (
                  <span className="mr-2 shrink-0 text-[var(--text-muted)]">
                    {icon}
                  </span>
                )}
                <span className="truncate block w-full">
                  <SelectPrimitive.Value placeholder={placeholder} />
                </span>
              </div>
              <SelectPrimitive.Icon asChild>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
              <SelectPrimitive.Content
                className="z-[9999] min-w-32 max-h-[300px] overflow-hidden rounded-md border border-[var(--glass-outline)] bg-[var(--glass-surface)] backdrop-blur-xl shadow-xl animate-in fade-in-80 zoom-in-95"
                position="popper"
                sideOffset={4}
              >
                <SelectPrimitive.Viewport className="p-1 max-h-[300px] overflow-y-auto">
                  {parsedOptions.map((opt, i) => {
                    if ('options' in opt) {
                      return (
                        <SelectPrimitive.Group key={i}>
                          <SelectPrimitive.Label className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]">
                            {opt.label}
                          </SelectPrimitive.Label>
                          {opt.options.map((subOpt, subIdx) => (
                            <SelectPrimitive.Item
                              key={
                                subOpt.value === ''
                                  ? `empty-${i}-${subIdx}`
                                  : `${subOpt.value}-${i}-${subIdx}`
                              }
                              value={
                                subOpt.value === '' ? EMPTY_VALUE : subOpt.value
                              }
                              disabled={subOpt.disabled}
                              className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-[var(--text-primary)] outline-none focus:bg-[var(--primary-resonance)] focus:text-white data-disabled:pointer-events-none data-disabled:opacity-50"
                            >
                              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                <SelectPrimitive.ItemIndicator>
                                  <Check className="h-4 w-4" />
                                </SelectPrimitive.ItemIndicator>
                              </span>
                              <SelectPrimitive.ItemText>
                                {extractStringValue(subOpt.label)}
                              </SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Group>
                      );
                    }
                    return (
                      <SelectPrimitive.Item
                        key={
                          opt.value === '' ? `empty-${i}` : `${opt.value}-${i}`
                        }
                        value={opt.value === '' ? EMPTY_VALUE : opt.value}
                        disabled={opt.disabled}
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-[var(--text-primary)] outline-none focus:bg-[var(--primary-resonance)] focus:text-white data-disabled:pointer-events-none data-disabled:opacity-50"
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          <SelectPrimitive.ItemIndicator>
                            <Check className="h-4 w-4" />
                          </SelectPrimitive.ItemIndicator>
                        </span>
                        <SelectPrimitive.ItemText>
                          {extractStringValue(opt.label)}
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
            className={`text-xs mt-1 ${isError ? 'text-red-500' : 'text-[var(--text-muted)]'}`}
          >
            {errorMsg || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
