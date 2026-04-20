import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header, MobileNav } from './components/Navigation';
import { GuestOnlyRoute, ProtectedRoute } from './components/ProtectedRoute';
import { ExplorePage } from './pages/ExplorePage';
import { PetDetailPage } from './pages/PetDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdoptionFormPage } from './pages/AdoptionFormPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { MapMode } from './pages/MapMode';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<PageWrapper><ExplorePage /></PageWrapper>} />
        <Route path="/favorites" element={<PageWrapper><ProtectedRoute><FavoritesPage /></ProtectedRoute></PageWrapper>} />
        <Route path="/pet/:id" element={<PageWrapper><PetDetailPage /></PageWrapper>} />
        <Route path="/profile" element={<PageWrapper><ProtectedRoute><ProfilePage /></ProtectedRoute></PageWrapper>} />
        <Route path="/apply" element={<PageWrapper><ProtectedRoute><AdoptionFormPage /></ProtectedRoute></PageWrapper>} />
        <Route path="/map" element={<PageWrapper><MapMode /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><GuestOnlyRoute><AuthPage mode="login" /></GuestOnlyRoute></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><GuestOnlyRoute><AuthPage mode="register" /></GuestOnlyRoute></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><GuestOnlyRoute><ForgotPasswordPage /></GuestOnlyRoute></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
        {/* Fallback */}
        <Route path="*" element={<PageWrapper><ExplorePage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen relative flex flex-col">
        <Header />
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 mt-0 md:mt-4">
          <AnimatedRoutes />
        </main>
        <MobileNav />
      </div>
    </BrowserRouter>
  );
}
