import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getToken, getUserRoles } from '../../services/auth';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  ListItemButton,
  IconButton,
  styled,
  Typography,
  Badge,
  useTheme,
  useMediaQuery,
  Hidden,
  Button,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LanguageIcon from '@mui/icons-material/Language';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import logoImage from '../../logo.svg';
import { useNotifications } from '../../hooks/useNotifications';
import { useUnreadChats } from '../../hooks/useUnreadChats';
import axiosInstance from "../../util/axiosInstance";

const drawerWidth = 280;

const Logo = styled('img')({
  width: 'auto',
  height: '32px',
});

const DrawerContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  height: 64,
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  gap: theme.spacing(2),
  flexShrink: 0,
}));

const BrandTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 700,
  color: theme.palette.primary.main,
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
}));

const ScrollableListContainer = styled(Box)({
  overflowY: 'auto',
  flexGrow: 1,
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1', 
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#888', 
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#555', 
  },
});

const BottomNavContainer = styled(Box)({
  marginTop: 'auto',
  paddingBottom: 0,
  flexShrink: 0,
});

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, handleDrawerToggle }) => {
  const { t, i18n } = useTranslation();
  const token = getToken();
  const roles = getUserRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  const { unreadChatsCount } = useUnreadChats();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await axiosInstance.post('/auth/logout', null, {
          params: { refreshToken }
        });
      } catch (e) {
        console.warn('Failed to revoke refresh token', e);
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    handleDrawerToggle();
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('selectedLanguage', lng);
  };

  const isActive = (path: string) => {
    if (location.pathname === path) return true;
    
    switch (path) {
      case '/events':
        return location.pathname === '/events';
      case '/my-events':
        return location.pathname === '/my-events';
      case '/my-applications':
        return location.pathname === '/my-applications';
      case '/organizer-applications':
        return location.pathname === '/organizer-applications';
      case '/moderation/pending':
      case '/moderation/approved':
        return location.pathname === path;
      case '/notifications':
        return location.pathname === '/notifications';
      case '/chats':
        return location.pathname === '/chats';
      case '/my-profile':
        return location.pathname === '/my-profile';
      default:
        return location.pathname === path;
    }
  };

  const handleMenuItemClick = (path: string) => {
    if (isActive(path)) {
      navigate(0);
    } else {
      navigate(path);
    }
    handleDrawerToggle();
  };

  const drawerItems = (
    <DrawerContent>
      <LogoContainer>
        <Logo src={logoImage} alt="GetScience Logo" />
        <BrandTitle>GetScience</BrandTitle>
      </LogoContainer>

      <ScrollableListContainer>
        <List sx={{ padding: 0 }}>
          {!token && (
            <>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleMenuItemClick('/login')}
                  selected={isActive('/login')}
                  sx={{ pl: 3 }}
                >
                  <ListItemIcon>
                    <LoginIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('login')} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleMenuItemClick('/register')}
                  selected={isActive('/register')}
                  sx={{ pl: 3 }}
                >
                  <ListItemIcon>
                    <PersonAddIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('register')} />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ my: 1 }} />
            </>
          )}

          {!(token && roles.includes('MODERATOR')) && (
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleMenuItemClick('/events')}
                selected={isActive('/events')}
                sx={{ pl: 3 }}
              >
                <ListItemIcon>
                  <EventIcon />
                </ListItemIcon>
                <ListItemText primary={t('events_list')} />
              </ListItemButton>
            </ListItem>
          )}

          {token && roles.includes('ORGANIZER') && (
            <>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleMenuItemClick('/my-events')}
                  selected={isActive('/my-events')}
                  sx={{ pl: 3 }}
                >
                  <ListItemIcon>
                    <ListAltIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('my_events')} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleMenuItemClick('/organizer-applications')}
                  selected={isActive('/organizer-applications')}
                  sx={{ pl: 3 }}
                >
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('organizer_applications')} />
                </ListItemButton>
              </ListItem>
            </>
          )}

          {token && roles.includes('USER') && (
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleMenuItemClick('/my-applications')}
                selected={isActive('/my-applications')}
                sx={{ pl: 3 }}
              >
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText primary={t('my_applications')} />
              </ListItemButton>
            </ListItem>
          )}

          {token && roles.includes('MODERATOR') && (
              <>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => handleMenuItemClick('/moderation/pending')}
                    selected={isActive('/moderation/pending')}
                    sx={{ pl: 3 }}
                  >
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('moderation_pending')} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => handleMenuItemClick('/moderation/approved')}
                    selected={isActive('/moderation/approved')}
                    sx={{ pl: 3 }}
                  >
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('moderation_approved')} />
                  </ListItemButton>
                </ListItem>
              </>
          )}

          {token && (
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleMenuItemClick('/notifications')}
                  selected={isActive('/notifications')}
                  sx={{ pl: 3 }}
                >
                  <ListItemIcon>
                    <Badge
                        badgeContent={unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null}
                        color="error"
                    >
                      <NotificationsIcon/>
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary={t('notifications')}/>
                </ListItemButton>
              </ListItem>
          )}

          {token && (
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleMenuItemClick('/chats')}
                selected={isActive('/chats')}
                sx={{ pl: 3 }}
              >
                <ListItemIcon>
                  <Badge
                    badgeContent={unreadChatsCount > 0 ? (unreadChatsCount > 99 ? '99+' : unreadChatsCount) : null}
                    color="error"
                  >
                    <ChatIcon />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary={t('chats') ?? "Chats"} />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </ScrollableListContainer>

      <BottomNavContainer>
        {token && (
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleMenuItemClick('/my-profile')}
                selected={isActive('/my-profile')}
                sx={{ pl: 3 }}
              >
                <ListItemIcon>
                  <PersonIcon/>
                </ListItemIcon>
                <ListItemText primary={t('my_profile')}/>
              </ListItemButton>
            </ListItem>
        )}
        <Divider sx={{ mt: 1 }}/>
        <List>
          <ListItem disablePadding>
            <ListItem sx={{ pl: 3, cursor: 'default' }}>
              <ListItemIcon>
                <LanguageIcon />
              </ListItemIcon>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    size="small"
                    variant={i18n.language === 'en' ? 'contained' : 'outlined'}
                    onClick={() => changeLanguage('en')}
                >
                  EN
                </Button>
                <Button
                    size="small"
                    variant={i18n.language === 'ru' ? 'contained' : 'outlined'}
                    onClick={() => changeLanguage('ru')}
                >
                  RU
                </Button>
              </Box>
            </ListItem>
          </ListItem>

          {token && (
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={{ pl: 3 }}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary={t('log_out')} />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </BottomNavContainer>
    </DrawerContent>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerItems}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, position: 'fixed', height: '100vh' },
        }}
        open
      >
        {drawerItems}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
