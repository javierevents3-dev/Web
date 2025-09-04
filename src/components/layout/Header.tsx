import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import ContactBlock from './ContactBlock';
import Logo from '../ui/Logo';
import LanguageSelector from '../ui/LanguageSelector';
import CartIcon from '../cart/CartIcon';
import LoginModal from '../auth/LoginModal';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const location = useLocation();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  const handleBooking = () => {
    const message = t('nav.bookMessage');
    window.open(`https://wa.me/5541984875565?text=${encodeURIComponent(message)}`, '_blank');
  };

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.portfolio'), path: '/portfolio' },
    { name: t('nav.portraits'), path: '/portrait' },
    { name: t('nav.maternity'), path: '/maternity' },
    { name: t('nav.events'), path: '/events' },
    { name: t('nav.store'), path: '/store' },
    { name: t('nav.book'), action: handleBooking },
    { name: t('nav.contact'), path: '/contact' },
  ];

  const isHomePage = location.pathname === '/';

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled || !isHomePage
          ? 'bg-primary py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container-custom flex justify-between items-center">
        <Link to="/" className="z-50">
          <Logo dark={false} />
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <ul className="flex space-x-8">
            {navLinks.map((link) => (
              <li key={link.name}>
                {link.path ? (
                  <Link 
                    to={link.path} 
                    className="font-lato text-sm tracking-wide uppercase text-white hover:text-secondary transition-colors"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <button
                    onClick={link.action}
                    className="font-lato text-sm tracking-wide uppercase text-white hover:text-secondary transition-colors"
                  >
                    {link.name}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center space-x-6 text-white">
            <ContactBlock iconOnly={true} dark={false} />
            <CartIcon />
            
            {/* User Authentication */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-white hover:text-secondary transition-colors">
                  <User size={20} />
                  <span className="text-sm hidden lg:inline">
                    {user.user_metadata?.name?.split(' ')[0] || 'Cliente'}
                  </span>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Meus Contratos
                    </Link>
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-white hover:text-secondary transition-colors p-2 rounded-lg hover:bg-white/10">
                  <User size={20} />
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        setLoginMode('login');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        setLoginMode('register');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Criar Conta
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <LanguageSelector />
          </div>
        </nav>

        <div className="md:hidden flex items-center space-x-4">
          <CartIcon />
          <button 
            className="z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X size={24} className="text-primary" />
            ) : (
              <Menu size={24} className="text-white" />
            )}
          </button>
        </div>

        <div className={`fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full pt-24 px-6">
            <ul className="flex flex-col space-y-6 text-center">
              {navLinks.map((link) => (
                <li key={link.name}>
                  {link.path ? (
                    <Link 
                      to={link.path} 
                      className="text-primary font-lato text-lg uppercase tracking-wide hover:text-secondary transition-colors"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <button
                      onClick={link.action}
                      className="text-primary font-lato text-lg uppercase tracking-wide hover:text-secondary transition-colors"
                    >
                      {link.name}
                    </button>
                  )}
                </li>
              ))}
              
              {/* Mobile Auth */}
              <li className="border-t pt-6 mt-6">
                {user ? (
                  <div className="space-y-4">
                    <Link 
                      to="/dashboard"
                      className="text-primary font-lato text-lg uppercase tracking-wide hover:text-secondary transition-colors flex items-center gap-2"
                    >
                      <User size={20} />
                      Meus Contratos
                    </Link>
                    <button
                      onClick={signOut}
                      className="text-primary font-lato text-lg uppercase tracking-wide hover:text-secondary transition-colors"
                    >
                      Sair
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        setLoginMode('login');
                      }}
                      className="text-primary font-lato text-lg uppercase tracking-wide hover:text-secondary transition-colors flex items-center gap-2"
                    >
                      <User size={20} />
                      Entrar
                    </button>
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        setLoginMode('register');
                      }}
                      className="text-primary font-lato text-lg uppercase tracking-wide hover:text-secondary transition-colors"
                    >
                      Criar Conta
                    </button>
                  </div>
                )}
              </li>
            </ul>
            <div className="mt-auto pb-10">
              <ContactBlock iconOnly={false} dark={true} />
              <div className="mt-6 flex justify-center">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        initialMode={loginMode}
      />
    </header>
  );
};

export default Header;