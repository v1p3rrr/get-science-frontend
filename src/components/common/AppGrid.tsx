import React from 'react';
import { Grid, GridProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledGrid = styled(Grid)(({ theme }) => ({
  // Можно добавить дополнительные стили здесь
}));

// Используем тип GridProps напрямую, чтобы сохранить все пропсы Grid
export type AppGridProps = GridProps;

export const AppGrid: React.FC<AppGridProps> = (props) => {
  return <StyledGrid {...props} />;
}; 