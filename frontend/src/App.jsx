import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Users from './pages/Users.jsx';
import Scripts from './pages/Scripts.jsx';
import Executions from './pages/Executions.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* <Route element={<ProtectedRoute />}> */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/scripts" element={<Scripts />} />
          <Route path="/executions" element={<Executions />} />
        </Route>
      {/* </Route> */}
    </Routes>
  );
}

export default App;