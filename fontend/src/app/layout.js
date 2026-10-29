import './globals.css';
import './overrides.css';
import './modern.css';
import Providers from './providers';

export const metadata = { title: 'HRPro – Quản lý Nhân sự' };

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
