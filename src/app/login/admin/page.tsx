import LoginForm from '@/components/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - PrintMIS',
  description: 'Log in to the admin dashboard to manage your printing business',
};

export default function AdminLoginPage() {
  return <LoginForm userType="admin" />;
} 