import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Globe from './components/Globe';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Payouts from './pages/Payouts';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Legal from './pages/Legal';
import AdminPanel from './pages/AdminPanel';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          {/* 3D Background - Fixed */}
          <div className="canvas-container">
            <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
              <Suspense fallback={null}>
                <Globe />
              </Suspense>
            </Canvas>
          </div>

          {/* UI Overlay - Scrollable */}
          <div className="content-overlay">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/legal/:slug" element={<Legal />} />
              <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
