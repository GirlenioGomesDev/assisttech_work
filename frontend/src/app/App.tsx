import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './routes';
import { AlertToToastBridge } from './components/AlertToToastBridge';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <AlertToToastBridge />
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" closeButton />
    </AuthProvider>
  );
}
