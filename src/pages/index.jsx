import Layout from "./Layout.jsx";

import Feed from "./Feed";

import CreatePost from "./CreatePost";

import Profile from "./Profile";

import Explore from "./Explore";

import Notifications from "./Notifications";

import CreateStory from "./CreateStory";

import UserProfile from "./UserProfile";

import Home from "./Home";

import ManageHomeVideo from "./ManageHomeVideo";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Feed: Feed,
    
    CreatePost: CreatePost,
    
    Profile: Profile,
    
    Explore: Explore,
    
    Notifications: Notifications,
    
    CreateStory: CreateStory,
    
    UserProfile: UserProfile,
    
    Home: Home,
    
    ManageHomeVideo: ManageHomeVideo,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Feed />} />
                
                
                <Route path="/Feed" element={<Feed />} />
                
                <Route path="/CreatePost" element={<CreatePost />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Explore" element={<Explore />} />
                
                <Route path="/Notifications" element={<Notifications />} />
                
                <Route path="/CreateStory" element={<CreateStory />} />
                
                <Route path="/UserProfile" element={<UserProfile />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/ManageHomeVideo" element={<ManageHomeVideo />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}