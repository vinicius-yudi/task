import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Login} from '@/pages/Login';
import { Register } from '@/pages/Register';
import { AuthProvider } from '@/contexts/AuthContext';
import { PrivateRoute } from '@/components/PrivateRoute';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider, useTheme } from '@/components/Theme-provider';

axios.defaults.withCredentials = true;

function ThemedToasts() {
  const { theme } = useTheme()
  const location = useLocation();
  
  const systemPrefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches

  const resolved = theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme

  const position = location.pathname === '/' ? 'bottom-right' : 'top-right';

  return (
    <ToastContainer
      position={position}
      autoClose={2000}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={resolved as "light" | "dark"}
    />
  )
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/auth/me", { withCredentials: true });
        setUser(response.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }
, []);

  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="*" element={<h1>404 - Página Não Encontrada</h1>} />
          </Routes>
          <ThemedToasts />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;