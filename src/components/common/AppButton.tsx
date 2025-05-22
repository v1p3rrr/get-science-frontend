import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  minWidth: 120,
  '&.MuiButton-contained': {
    boxShadow: 'none',
    '&:hover': {
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
  },
}));

export interface AppButtonProps extends Omit<ButtonProps, 'css'> {
  children: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
}; 