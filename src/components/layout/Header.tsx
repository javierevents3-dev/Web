import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';
import LanguageSelector from '../ui/LanguageSelector';
import CartIcon from '../cart/CartIcon';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

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
            <CartIcon />
            
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
              
            </ul>
            <div className="mt-auto pb-10">
              <div className="mt-6 flex justify-center">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </header>
  );
};

export default Header;
