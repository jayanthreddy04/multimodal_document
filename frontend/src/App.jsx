import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import OCRViewer from './pages/OCRViewer';
import Chat from './pages/Chat';
import Insights from './pages/Insights';
import History from './pages/History';
import Search from './pages/Search';

function App() {
  const { token } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/ocr" element={<OCRViewer />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/history" element={<History />} />
        <Route path="/search" element={<Search />} />
      </Route>

      <Route path="*" element={<Navigate to={token ? '/' : '/login'} />} />
    </Routes>
  );
}

export default App;
