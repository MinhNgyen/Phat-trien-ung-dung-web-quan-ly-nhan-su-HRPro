import { Suspense } from 'react';
import EmployeesPage from '@/features/employees/EmployeesPage';

// Suspense cần vì EmployeesPage đọc ?q= bằng useSearchParams
export default function Page() {
  return <Suspense fallback={null}><EmployeesPage /></Suspense>;
}
