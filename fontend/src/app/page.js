import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard'); // chưa đăng nhập thì AppShell tự đưa về /login
}
