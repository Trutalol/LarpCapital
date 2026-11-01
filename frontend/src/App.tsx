import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Accounts from './pages/Accounts';
import AddAccount from './pages/AddAccount';
import AccountDetail from './pages/AccountDetail';
import Trade from './pages/Trade';
import Payouts from './pages/Payouts';
import Certificates from './pages/Certificates';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import LarpStudio from './pages/LarpStudio';
import { startEngine } from './lib/store';

export default function App() {
  useEffect(() => startEngine(), []);
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/accounts" replace />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/add" element={<AddAccount />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/payouts" element={<Payouts />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/studio" element={<LarpStudio />} />
          <Route path="*" element={<Navigate to="/accounts" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
