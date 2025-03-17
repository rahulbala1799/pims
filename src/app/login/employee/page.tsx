import LoginForm from '@/components/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employee Login - PrintMIS',
  description: 'Log in to track your assigned jobs and update progress',
};

export default function EmployeeLoginPage() {
  return <LoginForm userType="employee" />;
} 