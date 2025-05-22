import React, { useEffect, useState } from 'react';
import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import EventList from './components/events/list/EventList';
import EventDetails from './components/events/details/EventDetails';
import Header from './components/common/Header';
import './styles/style.css';
import Sidebar from "./components/common/Sidebar";
import EventForm from "./components/events/form/EventForm";
import NotFound from "./components/common/NotFound";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import VerifyEmail from "./components/auth/VerifyEmail";
import MyEvents from "./components/events/list/MyEvents";
import i18n from "./i18n";
import {I18nextProvider} from "react-i18next";
import ApplicationForm from './components/applications/form/ApplicationForm';
import { getUserRoles, getToken, fetchAndStoreUserProfileId } from './services/auth';
import MyApplications from "./components/applications/list/MyApplications";
import OrganizerApplications from "./components/applications/list/OrganizerApplications";
import { CssBaseline, Box, styled, useTheme, useMediaQuery } from '@mui/material';
import { ThemeProvider } from './theme/ThemeContext';
import MyProfile from "./components/profile/MyProfile";
import PublicProfile from "./components/profile/PublicProfile";
import { NotificationList } from "./components/notifications/NotificationList";
import EditEventPage from "./components/events/form/EditEventPage";
import ApplicationDetails from './components/applications/details/ApplicationDetails';
import ReviewApplication from './components/applications/review/ReviewApplication';
import ProtectedRoute from "./util/ProtectedRoute";
import ModerationEventList from './components/events/list/ModerationEventList';
import ChatListPage from './components/chat/ChatListPage';
import ChatPage from './components/chat/ChatPage';

const drawerWidth = 280;
const headerHeight = 64;

const RootBox = styled(Box)({
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
});

const MainContent = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isMobile' && prop !== 'isDrawerOpen',
})<{ isMobile?: boolean; isDrawerOpen?: boolean }>(({ theme, isMobile }) => ({
    flexGrow: 1,
    marginTop: headerHeight,
    backgroundColor: theme.palette.background.default,
    position: 'relative',
    width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
    marginLeft: 0,//isMobile ? 0 : `${drawerWidth}px`,
    minHeight: `calc(100vh - ${headerHeight}px)`,
    padding: theme.spacing(2, 2, 2, 2),
    boxSizing: 'border-box',
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
}));

const ContentWrapper = styled(Box)({
    padding: 0,
    maxWidth: '100%',
    height: '100%',
    boxSizing: 'border-box',
});

const App: React.FC = () => {
    const roles = getUserRoles();
    const isModerator = roles.includes('MODERATOR');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    useEffect(() => {
        const initApp = async () => {
            if (getToken()) {
                await fetchAndStoreUserProfileId();
            }
        };
        initApp();
    }, []);

    return (
        <ThemeProvider>
            <CssBaseline />
            <I18nextProvider i18n={i18n}>
                <Router>
                    <RootBox>
                        <Header handleDrawerToggle={handleDrawerToggle} />
                        <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
                        <MainContent isMobile={isMobile}>
                            <ContentWrapper>
                                <Routes>
                                    {isModerator ? (
                                        <Route path="/events" element={<Navigate replace to="/moderation/pending" />} />
                                    ) : (
                                        <Route path="/events" element={<EventList />} />
                                    )}
                                    <Route path="/events/:eventId" element={<EventDetails/>}/>
                                    <Route path="/my-profile" element={<ProtectedRoute><MyProfile/></ProtectedRoute>} />
                                    <Route path="/profile/:profileId" element={<PublicProfile/>} />
                                    <Route path="/my-events" element={<ProtectedRoute requiredRoles={['ORGANIZER']}><MyEvents/></ProtectedRoute>} />
                                    <Route path="/events/:eventId/edit" element={<ProtectedRoute requiredRoles={['ORGANIZER']}><EditEventPage /></ProtectedRoute>} />
                                    <Route path="/create-event" element={<ProtectedRoute requiredRoles={['ORGANIZER']}><EventForm mode="create" onSave={() => {}} /></ProtectedRoute>} />
                                    <Route path="/notifications" element={<ProtectedRoute><NotificationList/></ProtectedRoute>} />
                                    <Route path="/my-applications" element={<ProtectedRoute requiredRoles={['USER']}><MyApplications /></ProtectedRoute>} />
                                    <Route path="/applications/:applicationId" element={<ProtectedRoute><ApplicationDetails /></ProtectedRoute>} />
                                    <Route path="/applications/:applicationId/edit" element={<ProtectedRoute><ApplicationForm /></ProtectedRoute>} />
                                    <Route path="/applications/:applicationId/review" element={<ProtectedRoute><ReviewApplication /></ProtectedRoute>} />
                                    <Route path="/register" element={<ProtectedRoute onlyIfUnauthenticated><Register/></ProtectedRoute>}/>
                                    <Route path="/login" element={<ProtectedRoute onlyIfUnauthenticated><Login/></ProtectedRoute>}/>
                                    <Route path="/forgot-password" element={<ProtectedRoute onlyIfUnauthenticated><ForgotPassword/></ProtectedRoute>}/>
                                    <Route path="/reset-password" element={<ResetPassword/>}/>
                                    <Route path="/verify-email" element={<VerifyEmail/>}/>
                                    <Route path="/organizer-applications" element={<ProtectedRoute requiredRoles={['ORGANIZER']}><OrganizerApplications /></ProtectedRoute>} />
                                    <Route path="/events/:eventId/apply" element={<ProtectedRoute requiredRoles={['USER']}><ApplicationForm /></ProtectedRoute>} />
                                    <Route path="/moderation/pending" element={<ProtectedRoute requiredRoles={['MODERATOR']}><ModerationEventList status="pending" /></ProtectedRoute>} />
                                    <Route path="/moderation/approved" element={<ProtectedRoute requiredRoles={['MODERATOR']}><ModerationEventList status="approved" /></ProtectedRoute>} />
                                    <Route path="/events/:eventId/moderate" element={<ProtectedRoute requiredRoles={['MODERATOR']}><EditEventPage mode="moderate" /></ProtectedRoute>} />
                                    <Route path="/chats" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
                                    <Route path="/chats/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                                    <Route path="/events/:eventId/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                                    <Route path="*" element={<NotFound/>}/>
                                    {isModerator ? (
                                        <Route path="/" element={<Navigate replace to="/moderation/pending" />} />
                                    ) : (
                                        <Route path="/" element={<Navigate replace to="/events" />} />
                                    )}
                                </Routes>
                            </ContentWrapper>
                        </MainContent>
                    </RootBox>
                </Router>
            </I18nextProvider>
        </ThemeProvider>
    );
};

export default App;
