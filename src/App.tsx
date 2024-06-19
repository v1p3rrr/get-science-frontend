import React from 'react';
import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import EventList from './components/EventList';
import EventDetails from './components/EventDetails';
import Header from './components/Header';
import Footer from './components/Footer';
import './styles/style.css';
import Sidebar from "./components/Sidebar";
import EventForm from "./components/EventForm";
import NotFound from "./components/NotFound";
import Login from "./components/Login";
import Register from "./components/Register";
import MyEvents from "./components/MyEvents";
import i18n from "./i18n";
import {I18nextProvider} from "react-i18next";
import EditEventForm from "./components/EditEventForm";
import ApplicationForm from './components/ApplicationForm';
import { getUserRoles } from './auth/auth';
import MyApplications from "./components/MyApplications";
import OrganizerApplications from "./components/OrganizerApplications";
// import MyEvents from "./components/MyEvents";


const App: React.FC = () => {
    const roles = getUserRoles();

    return (
        <I18nextProvider i18n={i18n}>
            <Router>
                <Header/>
                <Sidebar/>
                <div className="main-content">
                    <Routes>
                        <Route path="/events" Component={EventList}/>
                        <Route path="/events/:eventId" element={<EventDetails/>}/>
                        {/*<Route path="/my-applications" Component={MyApplications} />*/}
                        {/*<Route path="/my-profile" Component={MyProfile} />*/}
                        <Route path="/my-events" Component={MyEvents}/>
                        <Route path="/edit-event/:eventId" element={<EditEventForm />} />
                        <Route path="/create-event" element={<EventForm onSave={() => {}}/>}/>
                        <Route path="/my-applications" element={<MyApplications />} />
                        <Route path="/register" Component={Register}/>
                        <Route path="/login" Component={Login}/>
                        <Route path="/organizer-applications" element={<OrganizerApplications />} />
                        {roles.includes('USER') ? (
                            <Route path="/events/:eventId/apply" element={<ApplicationForm />} />
                        ) : (
                            <Route path="/events/:eventId/apply" element={<ApplicationForm />} />
                            // <Route path="/events/:eventId/apply" element={<Navigate replace to="/events" />} />
                        )}
                        <Route Component={NotFound}/>
                        <Route path="/" element={<Navigate replace to="/events"/>}/>
                    </Routes>
                </div>
                <Footer/>
            </Router>
        </I18nextProvider>
    );
};


export default App;
