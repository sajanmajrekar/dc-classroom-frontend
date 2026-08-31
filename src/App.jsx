import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Classrooms from './pages/Classrooms';
import ClassDetail from './pages/ClassDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<DashboardLayout />}>
          <Route path="/classrooms" element={<Classrooms />} />
          <Route path="/classrooms/:id" element={<ClassDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
