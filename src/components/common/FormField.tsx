import React from 'react';
import { TextField, TextFieldProps, FormControl, FormHelperText, FormControlProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  width: '100%',
}));

export interface FormFieldProps extends Omit<TextFieldProps, 'css'> {
  error?: boolean;
  helperText?: string;
  formControlProps?: FormControlProps;
}

export const FormField: React.FC<FormFieldProps> = ({
  error,
  helperText,
  formControlProps,
  ...props
}) => {
  return (
    <StyledFormControl error={error} {...formControlProps}>
      <TextField
        fullWidth
        variant="outlined"
        error={error}
        {...props}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </StyledFormControl>
  );
}; 