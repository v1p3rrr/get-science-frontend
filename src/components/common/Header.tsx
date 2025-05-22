import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  styled,
  IconButton, Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme as useAppTheme } from '../../theme/ThemeContext';
import { fetchEventByIdAPI } from '../../api/eventsAPI';
import { fetchUserApplicationsAPI } from '../../api/applicationsAPI';

const drawerWidth = 280;

const StyledAppBar = styled(AppBar, {
    shouldForwardProp: (prop) => prop !== 'isMobile',
})<{ isMobile?: boolean }>(({ theme, isMobile }) => ({
  backgroundColor: theme.palette.primary.main,
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  position: 'fixed',
  width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
  marginLeft: isMobile ? 0 : drawerWidth,
  paddingTop: 0,
  zIndex: theme.zIndex.drawer + 1,
  height: 64,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `0 ${theme.spacing(2)}`,
}));

const PageTitle = styled(Typography)<{ isMobile?: boolean }>(({ theme, isMobile }) => ({
  fontWeight: 600,
  letterSpacing: '0.5px',
  color: '#fff',
  fontSize: '1.1rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textAlign: 'center',
  flexGrow: 1,
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
}));

const RightActionsContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
});

interface HeaderProps {
  handleDrawerToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ handleDrawerToggle }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { toggleTheme, isDarkMode } = useAppTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [pageTitle, setPageTitle] = useState<string>(t('app_name'));

  useEffect(() => {
    const fetchDynamicTitle = async () => {
      let titleKey = getStaticPageTitle(location.pathname);
      
      if (location.pathname.match(/^\/events\/\d+$/)) {
        const eventId = parseInt(location.pathname.split('/').pop() || '0', 10);
        if (!isNaN(eventId) && eventId > 0) {
          try {
            const event = await fetchEventByIdAPI(eventId);
            if (event) {
              titleKey = 'event_details'; 
            } else {
              titleKey = 'event_not_found';
            }
          } catch (error) {
            console.error('Ошибка при загрузке данных события:', error);
             titleKey = 'event_not_found';
          }
        }
      }
      else if (location.pathname.match(/^\/applications\/\d+$/)) {
         const applicationId = parseInt(location.pathname.split('/').pop() || '0', 10);
         if (!isNaN(applicationId) && applicationId > 0) {
           try {
             const applications = await fetchUserApplicationsAPI();
             const application = applications.find((app: any) => app.applicationId === applicationId);
             if (application) {
               titleKey = 'application_details';
             } else {
               titleKey = 'application_not_found';
             }
           } catch (error) {
             console.error('Ошибка при загрузке данных заявки:', error);
             titleKey = 'application_not_found';
           }
         }
      }
      
      setPageTitle(t(titleKey));
    };
    
    fetchDynamicTitle();
  }, [location.pathname, t]);

  const getStaticPageTitle = (pathname: string): string => {
    if (/^\/applications\/\d+$/.test(pathname)) return 'application_details';
    if (/^\/applications\/\d+\/edit$/.test(pathname)) return 'edit_application_title';
    if (/^\/applications\/\d+\/review$/.test(pathname)) return 'review_application_title';
  
    if (/^\/events\/\d+$/.test(pathname)) return 'event_details';
    if (/^\/events\/\d+\/edit$/.test(pathname)) return 'edit_event';
    if (/^\/events\/\d+\/edit-coowner$/.test(pathname)) return 'edit_event_coowner';
    if (/^\/events\/\d+\/apply$/.test(pathname)) return 'apply_for_event_title';
    if (/^\/events\/\d+\/moderate$/.test(pathname)) return 'moderate_event_title';
    if (/^\/events\/\d+\/chat$/.test(pathname)) return 'chat_page_title';
  
    if (/^\/profile\/\d+$/.test(pathname)) return 'public_profile_title';
    if (/^\/chats\/\d+$/.test(pathname)) return 'chat_page_title';
    
    switch (pathname) {
      case '/events': return 'events_list';
      case '/my-events': return 'my_events';
      case '/my-applications': return 'my_applications';
      case '/my-profile': return 'my_profile';
      case '/organizer-applications': return 'organizer_applications';
      case '/notifications': return 'notifications';
      case '/create-event': return 'create_event_title';
      case '/register': return 'register_title';
      case '/login': return 'login_title';
      case '/forgot-password': return 'forgot_password_title';
      case '/reset-password': return 'reset_password_title';
      case '/verify-email': return 'verify_email_title';
      case '/moderation/pending': return 'moderation_pending_title';
      case '/moderation/approved': return 'moderation_approved_title';
      case '/chats': return 'my_chats_title';
      case '/': return 'app_name';
      default:
        if (pathname.startsWith('/reset-password')) return 'reset_password_title';
        if (pathname.startsWith('/verify-email')) return 'verify_email_title';
        return 'app_name';
    }
  };

  return (
    <StyledAppBar isMobile={isMobile}>
      <StyledToolbar>
        <Box sx={{ width: 48, display: 'flex', justifyContent: 'flex-start' }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
        <PageTitle variant="h6" isMobile={isMobile}>
          {pageTitle}
        </PageTitle>
        <RightActionsContainer sx={{ width: 48, display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title={t('change_theme')}>
            <IconButton
                onClick={toggleTheme}
                color="inherit"
                edge="end"
                aria-label="toggle theme"
            >
              {isDarkMode ? <Brightness7Icon/> : <Brightness4Icon/>}
            </IconButton>
          </Tooltip>
        </RightActionsContainer>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Header;
