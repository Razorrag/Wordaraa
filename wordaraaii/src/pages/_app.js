// src/pages/_app.js

import '../styles/globals.css'; // Correct path for Pages Router
import VantaBackground from '@/components/shared/VantaBackground';
import DashboardLayout from '@/components/layout/DashboardLayout';

function MyApp({ Component, pageProps }) {
  const getLayout = () => {
    if (Component.layout === "Dashboard") {
      return (
        <DashboardLayout>
          <Component {...pageProps} />
        </DashboardLayout>
      );
    }
    return <Component {...pageProps} />;
  };

  return (
    <div className="relative min-h-screen">
      <VantaBackground />
      <main className="relative z-10">
        {getLayout()}
      </main>
    </div>
  );
}

export default MyApp;
