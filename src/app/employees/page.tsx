import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function EmployeesPage() {
  // Redirect to employees list
  redirect('/admin/employees');
  
  // This part won't actually be rendered due to the redirect above
  return (
    <div>
      <h1>Employees</h1>
      <p>Redirecting to employees list...</p>
      <Link href="/admin/employees">Go to Employees List</Link>
      <Link href="/admin/sales-employees">Manage Sales Employees</Link>
    </div>
  );
} 