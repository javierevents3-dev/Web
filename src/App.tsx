import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/ui/ScrollToTop';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import PortraitPage from './pages/PortraitPage';
import MaternityPage from './pages/MaternityPage';
import EventsPage from './pages/EventsPage';
import ContactPage from './pages/ContactPage';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';
import BookingPage from './pages/BookingPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import PackagesAdminPage from './pages/PackagesAdminPage';
import './styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/portrait" element={<PortraitPage />} />
              <Route path="/maternity" element={<MaternityPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/store" element={<StorePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/dashboard" element={<ClientDashboardPage />} />
              <Route path="/packages-admin" element={<PackagesAdminPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Layout>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
