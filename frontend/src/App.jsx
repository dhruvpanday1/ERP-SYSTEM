import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NLQuery from './pages/NLQuery';
import ProductSearch from './pages/ProductSearch';
import ImageSearch from './pages/ImageSearch';
import FinishedGoods from './pages/FinishedGoods';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/nl-query" element={<NLQuery />} />
              <Route path="/product-search" element={<ProductSearch />} />
              <Route path="/image-search" element={<ImageSearch />} />
              <Route path="/finished-goods" element={<FinishedGoods />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
