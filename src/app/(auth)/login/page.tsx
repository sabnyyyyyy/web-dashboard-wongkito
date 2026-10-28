'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_context/AuthContext';
import { LoginPage } from './_components/LoginPage';

export default function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) return null;

  return <LoginPage />;
}
