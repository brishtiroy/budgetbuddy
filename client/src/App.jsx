import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ModeSelect from './pages/ModeSelect';
import SingleDashboard from './pages/SingleDashboard';
import CoupleDashboard from './pages/CoupleDashboard';
import Goals from './pages/Goals';
import InvitePartner from './pages/InvitePartner';

// Protected route wrapper
function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mode" element={<PrivateRoute><ModeSelect /></PrivateRoute>} />
        <Route path="/dashboard/single" element={<PrivateRoute><SingleDashboard /></PrivateRoute>} />
        <Route path="/dashboard/couple" element={<PrivateRoute><CoupleDashboard /></PrivateRoute>} />
        <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
        <Route path="/invite" element={<PrivateRoute><InvitePartner /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}