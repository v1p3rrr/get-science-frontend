import React from 'react';
import { Card, CardProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

export interface AppCardProps extends Omit<CardProps, 'css'> {
  children: React.ReactNode;
}

export const AppCard: React.FC<AppCardProps> = ({ children, ...props }) => {
  return <StyledCard {...props}>{children}</StyledCard>;
}; 