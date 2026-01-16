import Home from './pages/Home';
import Accommodations from './pages/Accommodations';
import AccommodationDetail from './pages/AccommodationDetail';
import Gallery from './pages/Gallery';
import Experience from './pages/Experience';
import Location from './pages/Location';
import Contact from './pages/Contact';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Accommodations": Accommodations,
    "AccommodationDetail": AccommodationDetail,
    "Gallery": Gallery,
    "Experience": Experience,
    "Location": Location,
    "Contact": Contact,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};