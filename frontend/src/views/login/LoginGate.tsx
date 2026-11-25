'use client';

import { useEffect } from 'react';
import { preload } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/views/login/LoginPage';
import { LoadingScreen, LOGO_SRC } from '@/components/common/LoadingScreen';
import type { StoreInfo } from '@/types';

// How long the welcome screen stays after a successful login, so it reads as a step
// rather than a flicker. The dashboard layout keeps the same screen up while its data loads.
const WELCOME_SCREEN_MS = 900;

// Client side of /login: shows the form, then the welcome screen, then moves on to /dashboard.
export const LoginGate: React.FC<{ store: StoreInfo | null }> = ({ store }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Fetch the logo while the user is still typing, so the welcome screen shows it at once.
  preload(LOGO_SRC, { as: 'image' });

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    const timer = setTimeout(() => router.replace('/dashboard'), WELCOME_SCREEN_MS);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, router]);

  if (isAuthenticated) {
    return <LoadingScreen title={`Selamat datang, ${user?.name ?? ''}`} message="Menyiapkan dashboard..." />;
  }

  // Rendered while the session check is still running too, so the server already sends the form.
  return <LoginPage store={store} />;
};
