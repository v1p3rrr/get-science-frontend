import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  Autocomplete,
  IconButton,
  InputAdornment,
  Tooltip,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Event as EventIcon,
  EditCalendar as EditCalendarIcon, Clear
} from '@mui/icons-material';
import { fetchEventFilterMetadata } from '../../../api/eventsAPI';
import axiosInstance from '../../../util/axiosInstance';
import { LiveStatus } from '../../../models/Models';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS, ru } from 'date-fns/locale';
import Grid from "@mui/material/Grid";

interface FilterBarProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onApply: () => void;
  onReset?: () => void;
}

// Интерфейс для метаданных фильтрации
interface FilterMetadata {
  themes: string[];
  types: { name: string; displayName: string }[];
  formats: { name: string; displayName: string }[];
  locations: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onApply, onReset }) => {
  const { t, i18n } = useTranslation();
  const [metadata, setMetadata] = useState<FilterMetadata>({
    themes: [],
    types: [],
    formats: [],
    locations: []
  });
  const [loading, setLoading] = useState(true);
  const [addressInput, setAddressInput] = useState(filters.locations[0] || '');
  const [addressOptions, setAddressOptions] = useState<string[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const debounceTimeout = useRef<number>();

  // Загрузка метаданных фильтров при первом рендере компонента
  useEffect(() => {
    const loadMetadata = async () => {
      setLoading(true);
      try {
        const data = await fetchEventFilterMetadata();
        
        // Преобразуем enum значения в объекты с отображаемыми именами
        const typesWithDisplayNames = data.types.map((type: string) => ({
          name: type,
          displayName: t(type.toLowerCase())
        }));
        
        const formatsWithDisplayNames = data.formats.map((format: string) => ({
          name: format,
          displayName: t(format.toLowerCase())
        }));
        
        setMetadata({
          themes: data.themes || [],
          types: typesWithDisplayNames || [],
          formats: formatsWithDisplayNames || [],
          locations: data.locations || []
        });
      } catch (error) {
        console.error('Failed to load filter metadata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMetadata();
  }, [t]);

  // Обработчики для множественного выбора фильтров
  const handleTypesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFilterChange({ ...filters, types: value });
  };

  const handleThemesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFilterChange({ ...filters, themes: value });
  };

  const handleFormatsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFilterChange({ ...filters, formats: value });
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, title: event.target.value });
  };

  const handleObserversAllowedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, observersAllowed: event.target.checked });
  };

  const handleLiveStatusChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFilterChange({ ...filters, liveStatus: value });
  };

  const handleApplicationAvailableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, isApplicationAvailable: event.target.checked });
  };

  const handleDateFromChange = (date: Date | null) => {
    onFilterChange({ ...filters, dateFrom: date });
  };

  const handleDateToChange = (date: Date | null) => {
    onFilterChange({ ...filters, dateTo: date });
  };

  const handleClearDateFrom = () => {
    onFilterChange({ ...filters, dateFrom: null });
  };

  const handleClearDateTo = () => {
    onFilterChange({ ...filters, dateTo: null });
  };

  const handleClearFilters = () => {
    onFilterChange({
      types: [],
      themes: [],
      formats: [],
      locations: [],
      title: '',
      observersAllowed: false,
      liveStatus: [],
      isApplicationAvailable: false,
      dateFrom: null,
      dateTo: null
    });
    setAddressInput('');
    
    if (onReset) {
      onReset();
    } else {
      onApply();
    }
  };

  const fetchAddressSuggestions = async (query: string) => {
    setAddressLoading(true);
    try {
      const response = await axiosInstance.get(`/address/suggest`, {
        params: { query } 
      });
      setAddressOptions(response.data.map((item: any) => item.label || ''));
    } catch (error) {
      setAddressOptions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressInputChange = useCallback(
    (_: React.SyntheticEvent, value: string) => {
      setAddressInput(value);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      if (value.trim().length < 3) {
        setAddressOptions([]);
        return;
      }
      debounceTimeout.current = window.setTimeout(() => {
        fetchAddressSuggestions(value);
      }, 400);
    },
    []
  );

  const handleAddressChange = (_: React.SyntheticEvent, value: string | null) => {
    const newLocations = value ? [value] : [];
    onFilterChange({ ...filters, locations: newLocations });
  };

  const localeMap: Record<string, any> = { ru, en: enUS, enUS };
  const currentLocale = localeMap[i18n.language] || enUS;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={currentLocale}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          p: 2,
          borderRadius: 1,
          backgroundColor: 'background.paper',
          boxShadow: 1
        }}>
          {/* Верхняя строка фильтров */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: 'center',
            gap: 2,
            flexWrap: 'nowrap',
            justifyContent: 'space-between'
          }}>
            {/* Поиск по названию с иконкой */}
            <TextField
              label={t('search_by_title')}
              value={filters.title || ''}
              onChange={handleTitleChange}
              variant="outlined"
              size="small"
              sx={{ width: { xs: '100%', md: '22%' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: filters.title ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => onFilterChange({ ...filters, title: '' })}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
            
            {/* Тип мероприятия */}
            <FormControl 
              size="small" 
              sx={{ width: { xs: '100%', md: '18%' } }}
            >
              <InputLabel id="event-types-label">{t('event_type')}</InputLabel>
              <Select
                labelId="event-types-label"
                multiple
                value={filters.types || []}
                onChange={handleTypesChange}
                input={<OutlinedInput id="select-types" label={t('event_type')} />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const type = metadata.types.find(t => t.name === value);
                      return <Chip size="small" key={value} label={type?.displayName || value} />;
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250
                    }
                  }
                }}
              >
                {metadata.types.map((type) => (
                  <MenuItem key={type.name} value={type.name}>
                    {type.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Тема мероприятия */}
            <FormControl 
              size="small" 
              sx={{ width: { xs: '100%', md: '18%' } }}
            >
              <InputLabel id="event-themes-label">{t('event_theme')}</InputLabel>
              <Select
                labelId="event-themes-label"
                multiple
                value={filters.themes || []}
                onChange={handleThemesChange}
                input={<OutlinedInput id="select-themes" label={t('event_theme')} />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip size="small" key={value} label={value} />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250
                    }
                  }
                }}
              >
                {metadata.themes.map((theme) => (
                  <MenuItem key={theme} value={theme}>
                    {theme}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Формат мероприятия */}
            <FormControl 
              size="small" 
              sx={{ width: { xs: '100%', md: '18%' } }}
            >
              <InputLabel id="event-formats-label">{t('event_format')}</InputLabel>
              <Select
                labelId="event-formats-label"
                multiple
                value={filters.formats || []}
                onChange={handleFormatsChange}
                input={<OutlinedInput id="select-formats" label={t('event_format')} />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const format = metadata.formats.find(f => f.name === value);
                      return <Chip size="small" key={value} label={format?.displayName || value} />;
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250
                    }
                  }
                }}
              >
                {metadata.formats.map((format) => (
                  <MenuItem key={format.name} value={format.name}>
                    {format.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Местоположение с автодополнением */}
            <Autocomplete
              freeSolo
              options={addressOptions}
              loading={addressLoading}
              value={addressInput}
              inputValue={addressInput}
              onInputChange={handleAddressInputChange}
              onChange={handleAddressChange}
              size="small"
              sx={{ width: { xs: '100%', md: '18%' } }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('event_location')}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {addressLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
          
          {/* Разделитель строк */}
          <Divider />
          
          {/* Нижняя строка фильтров */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: 'center',
            gap: 2,
            flexWrap: 'nowrap'
          }}>
            {/* Статус мероприятия */}
            <FormControl 
              size="small" 
              sx={{ width: { xs: '100%', md: '220px' } }}
            >
              <InputLabel id="event-status-label">{t('event_status')}</InputLabel>
              <Select
                labelId="event-status-label"
                multiple
                value={filters.liveStatus || []}
                onChange={handleLiveStatusChange}
                input={<OutlinedInput id="select-status" label={t('event_status')} />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip 
                        size="small" 
                        key={value} 
                        label={t(`event_status_${value.toLowerCase()}`)} 
                      />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250
                    }
                  }
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <EventIcon fontSize="small" />
                  </InputAdornment>
                }
              >
                {Object.values(LiveStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {t(`event_status_${status.toLowerCase()}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Период проведения: с */}
            <Grid item xs={6}>
              <DatePicker
                  label={`${t('date_range')} ${t('date_from')}`}
                  value={filters.dateFrom || null}
                  onChange={(newValue) => handleDateFromChange(newValue as Date | null)}
                  PopperProps={{
                    sx: {
                      '.MuiPickersPopper-paper': { minWidth: 360 },
                      '.MuiPickersCalendarHeader-label': { minWidth: 140 },
                      '.MuiPickersArrowSwitcher-root': {
                        display: 'flex',
                        justifyContent: 'flex-end',
                        '& .MuiButtonBase-root': {
                          padding: '4px',
                          minWidth: '30px'
                        }
                      }
                    }
                  }}
                  renderInput={(params) => (
                      <TextField
                          {...params}
                          inputProps={{ ...params.inputProps, placeholder: t('date_placeholder') }}
                          size="small"
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              '& .MuiInputAdornment-root': {
                                marginLeft: 0,
                                '& .MuiButtonBase-root': {
                                  padding: '4px',
                                }
                              }
                            },
                            endAdornment: (
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: '2px',
                                  ml: 'auto',
                                  minWidth: 'auto'
                                }}>
                                  <IconButton
                                      size="small"
                                      onClick={handleClearDateFrom}
                                  >
                                    <Clear fontSize="small" />
                                  </IconButton>
                                  {params.InputProps?.endAdornment}
                                </Box>
                            ),
                          }}
                      />
                  )}
              />
            </Grid>
            
            {/* Период проведения: по */}
            <Grid item xs={6}>
              <DatePicker
                  label={`${t('date_range')} ${t('date_to')}`}
                  value={filters.dateTo || null}
                  onChange={(newValue) => handleDateToChange(newValue as Date | null)}
                  PopperProps={{
                    sx: {
                      '.MuiPickersPopper-paper': { minWidth: 360 },
                      '.MuiPickersCalendarHeader-label': { minWidth: 140 },
                      '.MuiPickersArrowSwitcher-root': {
                        display: 'flex',
                        justifyContent: 'flex-end',
                        '& .MuiButtonBase-root': {
                          padding: '4px',
                          minWidth: '30px'
                        }
                      }
                    }
                  }}
                  renderInput={(params) => (
                      <TextField
                          {...params}
                          inputProps={{ ...params.inputProps, placeholder: t('date_placeholder') }}
                          size="small"
                          InputProps={{
                            ...params.InputProps,
                            sx: {
                              '& .MuiInputAdornment-root': {
                                marginLeft: 0,
                                '& .MuiButtonBase-root': {
                                  padding: '4px',
                                }
                              }
                            },
                            endAdornment: (
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: '2px',
                                  ml: 'auto',
                                  minWidth: 'auto'
                                }}>
                                  <IconButton
                                      size="small"
                                      onClick={handleClearDateTo}
                                  >
                                    <Clear fontSize="small" />
                                  </IconButton>
                                  {params.InputProps?.endAdornment}
                                </Box>
                            ),
                          }}
                      />
                  )}
              />
            </Grid>

            {/* Чекбоксы */}
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
              {/* Чекбокс для наблюдателей */}
              <Tooltip title={t('filter_observers_allowed')}>
                <FormControlLabel
                    control={
                      <Checkbox
                          checked={filters.observersAllowed || false}
                          onChange={handleObserversAllowedChange}
                          icon={<VisibilityIcon color="disabled"/>}
                          checkedIcon={<VisibilityIcon color="primary"/>}
                      />
                    }
                    label=""
                    sx={{ml: 0, mr: 0}}
                />
              </Tooltip>

              {/* Чекбокс для возможности подачи заявки */}
              <Tooltip title={t('application_available')}>
                <FormControlLabel
                    control={
                      <Checkbox
                          checked={filters.isApplicationAvailable || false}
                          onChange={handleApplicationAvailableChange}
                          icon={<EditCalendarIcon color="disabled"/>}
                          checkedIcon={<EditCalendarIcon color="primary"/>}
                      />
                    }
                    label=""
                    sx={{ml: 0, mr: 0}}
                />
              </Tooltip>
            </Box>

            {/* Кнопки поиска и очистки */}
            <Box sx={{display: 'flex', gap: 1, ml: {xs: 0, md: 'auto'}}}>
              <Button
                  variant="contained"
                  color="primary"
                  onClick={onApply}
                  sx={{minWidth: '100px'}}
              >
                {t('search')}
              </Button>
              <Tooltip title={t('clear_filter')}>
                <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                >
                  <ClearIcon/>
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default FilterBar;
