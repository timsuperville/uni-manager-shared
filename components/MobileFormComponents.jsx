/**
 * Mobile-Optimized Form Components
 * Touch-friendly form elements with responsive design
 */

import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
  Slide,
  AppBar,
  Toolbar,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import {
  useResponsive,
  useMobileForm,
  getSafeAreaPadding,
} from '../utils/responsiveUtils';

// Slide transition for mobile dialogs
const SlideTransition = React.forwardRef((props, ref) => (
  <Slide direction='up' ref={ref} {...props} />
));
SlideTransition.displayName = 'SlideTransition';

const MobileFormDialog = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'Save',
  maxWidth = 'sm',
  fullScreen: forceFullScreen = false,
}) => {
  const { isMobile } = useResponsive();
  const fullScreen = forceFullScreen || isMobile;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={fullScreen ? SlideTransition : undefined}
      sx={{
        '& .MuiDialog-paper': {
          ...(fullScreen && getSafeAreaPadding()),
          borderRadius: fullScreen ? 0 : 2,
        },
      }}
    >
      {fullScreen ? (
        <>
          <AppBar position='static' elevation={0}>
            <Toolbar>
              <IconButton
                edge='start'
                color='inherit'
                onClick={onClose}
                aria-label='close'
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
                {title}
              </Typography>
              {onSubmit && (
                <Button
                  color='inherit'
                  onClick={onSubmit}
                  startIcon={<SaveIcon />}
                  sx={{ minHeight: 44 }}
                >
                  {submitLabel}
                </Button>
              )}
            </Toolbar>
          </AppBar>
          <DialogContent sx={{ px: 2, py: 3 }}>{children}</DialogContent>
        </>
      ) : (
        <>
          <DialogTitle sx={{ pb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant='h6'>{title}</Typography>
              <IconButton
                onClick={onClose}
                sx={{ minWidth: 40, minHeight: 40 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>{children}</DialogContent>
          {onSubmit && (
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                variant='contained'
                onClick={onSubmit}
                startIcon={<SaveIcon />}
              >
                {submitLabel}
              </Button>
            </DialogActions>
          )}
        </>
      )}
    </Dialog>
  );
};

const MobileTextField = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  type = 'text',
  multiline = false,
  rows = 4,
  startIcon,
  endIcon,
  ...props
}) => {
  const { isMobile } = useResponsive();
  const { handleFieldFocus, handleFieldBlur } = useMobileForm();
  const fieldRef = useRef(null);

  return (
    <TextField
      ref={fieldRef}
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      required={required}
      type={type}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      variant='outlined'
      onFocus={() => handleFieldFocus(label)}
      onBlur={handleFieldBlur}
      sx={{
        mb: 2,
        '& .MuiOutlinedInput-root': {
          minHeight: isMobile ? 56 : 40,
          fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
          '& input': {
            minHeight: isMobile ? 24 : 20,
            padding: isMobile ? '16px 14px' : '12px 14px',
          },
          '& textarea': {
            fontSize: isMobile ? '16px' : '14px',
          },
        },
        '& .MuiInputLabel-root': {
          fontSize: isMobile ? '16px' : '14px',
          '&.MuiInputLabel-shrunk': {
            fontSize: '12px',
          },
        },
        '& .MuiFormHelperText-root': {
          fontSize: isMobile ? '12px' : '11px',
        },
      }}
      InputProps={{
        startAdornment: startIcon,
        endAdornment: endIcon,
        ...props.InputProps,
      }}
      {...props}
    />
  );
};

const MobileSelectField = ({
  label,
  value,
  onChange,
  options = [],
  error,
  helperText,
  required = false,
  ...props
}) => {
  const { isMobile } = useResponsive();

  return (
    <FormControl fullWidth sx={{ mb: 2 }} error={error}>
      <InputLabel
        required={required}
        sx={{
          fontSize: isMobile ? '16px' : '14px',
          '&.MuiInputLabel-shrunk': {
            fontSize: '12px',
          },
        }}
      >
        {label}
      </InputLabel>
      <Select
        value={value}
        onChange={onChange}
        label={label}
        sx={{
          minHeight: isMobile ? 56 : 40,
          fontSize: isMobile ? '16px' : '14px',
          '& .MuiSelect-select': {
            padding: isMobile ? '16px 14px' : '12px 14px',
          },
        }}
        {...props}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? 48 : 36,
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <FormHelperText sx={{ fontSize: isMobile ? '12px' : '11px' }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

const MobileCheckbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  ...props
}) => {
  const { isMobile } = useResponsive();

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          sx={{
            minWidth: isMobile ? 42 : 36,
            minHeight: isMobile ? 42 : 36,
            '& .MuiSvgIcon-root': {
              fontSize: isMobile ? 24 : 20,
            },
          }}
          {...props}
        />
      }
      label={
        <Typography sx={{ fontSize: isMobile ? '16px' : '14px' }}>
          {label}
        </Typography>
      }
      sx={{ mb: 1 }}
    />
  );
};

const MobileSwitch = ({
  label,
  checked,
  onChange,
  disabled = false,
  ...props
}) => {
  const { isMobile } = useResponsive();

  return (
    <FormControlLabel
      control={
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          sx={{
            '& .MuiSwitch-switchBase': {
              '& .MuiSwitch-thumb': {
                width: isMobile ? 20 : 18,
                height: isMobile ? 20 : 18,
              },
            },
            '& .MuiSwitch-track': {
              height: isMobile ? 14 : 12,
            },
          }}
          {...props}
        />
      }
      label={
        <Typography sx={{ fontSize: isMobile ? '16px' : '14px' }}>
          {label}
        </Typography>
      }
      sx={{ mb: 1 }}
    />
  );
};

const MobileAutocomplete = ({
  label,
  options = [],
  value,
  onChange,
  error,
  helperText,
  multiple = false,
  freeSolo = false,
  getOptionLabel = (option) => option?.label || option || '',
  renderOption,
  ...props
}) => {
  const { isMobile } = useResponsive();

  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={onChange}
      multiple={multiple}
      freeSolo={freeSolo}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              minHeight: isMobile ? 56 : 40,
              fontSize: isMobile ? '16px' : '14px',
              '& input': {
                minHeight: isMobile ? 24 : 20,
                padding: isMobile ? '16px 14px' : '12px 14px',
              },
            },
            '& .MuiInputLabel-root': {
              fontSize: isMobile ? '16px' : '14px',
              '&.MuiInputLabel-shrunk': {
                fontSize: '12px',
              },
            },
          }}
        />
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.value || option}
            label={getOptionLabel(option)}
            size={isMobile ? 'medium' : 'small'}
            sx={{
              height: isMobile ? 32 : 24,
              fontSize: isMobile ? '14px' : '12px',
            }}
          />
        ))
      }
      sx={{
        '& .MuiAutocomplete-listbox': {
          '& .MuiAutocomplete-option': {
            minHeight: isMobile ? 48 : 36,
            fontSize: isMobile ? '16px' : '14px',
          },
        },
      }}
      {...props}
    />
  );
};

// Example: Member Form Component
const MobileMemberForm = ({
  open,
  onClose,
  member = {},
  onSave,
  roles = [],
}) => {
  const [formData, setFormData] = useState({
    name: member.name || '',
    email: member.email || '',
    phone: member.phone || '',
    role: member.role || 'member',
    isActive: member.isActive !== false,
    permissions: member.permissions || [],
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    const value = event.target?.value ?? event;
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    onClose();
  };

  const roleOptions = [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Administrator' },
    { value: 'moderator', label: 'Moderator' },
    ...roles.map((role) => ({ value: role.id, label: role.name })),
  ];

  return (
    <MobileFormDialog
      open={open}
      onClose={onClose}
      title={member.id ? 'Edit Member' : 'Add Member'}
      onSubmit={handleSubmit}
      submitLabel={member.id ? 'Update' : 'Add Member'}
    >
      <Box sx={{ pt: 1 }}>
        <MobileTextField
          label='Full Name'
          value={formData.name}
          onChange={handleChange('name')}
          error={!!errors.name}
          helperText={errors.name}
          required
          startIcon={<PersonIcon sx={{ color: 'text.secondary', mr: 1 }} />}
        />

        <MobileTextField
          label='Email Address'
          value={formData.email}
          onChange={handleChange('email')}
          error={!!errors.email}
          helperText={errors.email}
          required
          type='email'
          startIcon={<EmailIcon sx={{ color: 'text.secondary', mr: 1 }} />}
        />

        <MobileTextField
          label='Phone Number'
          value={formData.phone}
          onChange={handleChange('phone')}
          type='tel'
          startIcon={<PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} />}
        />

        <MobileSelectField
          label='Role'
          value={formData.role}
          onChange={handleChange('role')}
          options={roleOptions}
          required
        />

        <MobileSwitch
          label='Active Member'
          checked={formData.isActive}
          onChange={(e) => handleChange('isActive')(e.target.checked)}
        />
      </Box>
    </MobileFormDialog>
  );
};

// PropTypes
MobileFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func,
  submitLabel: PropTypes.string,
  maxWidth: PropTypes.string,
  fullScreen: PropTypes.bool,
};

MobileTextField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  type: PropTypes.string,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  InputProps: PropTypes.object,
};

MobileSelectField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};

MobileCheckbox.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

MobileSwitch.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

MobileAutocomplete.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  multiple: PropTypes.bool,
  freeSolo: PropTypes.bool,
  getOptionLabel: PropTypes.func,
  renderOption: PropTypes.func,
};

MobileMemberForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  member: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  roles: PropTypes.array,
};

export {
  MobileFormDialog,
  MobileTextField,
  MobileSelectField,
  MobileCheckbox,
  MobileSwitch,
  MobileAutocomplete,
  MobileMemberForm,
};
