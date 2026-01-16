import AccommodationDetail from './pages/AccommodationDetail';
import Accommodations from './pages/Accommodations';
import Contact from './pages/Contact';
import Experience from './pages/Experience';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import Location from './pages/Location';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccommodationDetail": AccommodationDetail,
    "Accommodations": Accommodations,
    "Contact": Contact,
    "Experience": Experience,
    "Gallery": Gallery,
    "Home": Home,
    "Location": Location,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};