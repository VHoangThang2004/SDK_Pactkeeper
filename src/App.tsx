import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './features/auth/LoginScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { TopUpScreen } from './features/profile/TopUpScreen';
import { HistoryScreen } from './features/profile/HistoryScreen';
import { MissivesScreen } from './features/profile/MissivesScreen';
import { SupportChat } from './features/support/SupportChat';
import { AdminDashboardScreen } from './features/profile/AdminDashboardScreen';
import { AdminChatScreen } from './features/profile/AdminChatScreen';
import { CheckoutScreen } from './features/payment/CheckoutScreen';
import { PaymentResultScreen } from './features/payment/PaymentResultScreen';

function App() {
  const { isLoggedIn, role } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Public payment routes (for mobile browser redirects) */}
        <Route path="/payment/success" element={<PaymentResultScreen isSuccess={true} />} />
        <Route path="/payment/cancel" element={<PaymentResultScreen isSuccess={false} />} />

        {!isLoggedIn ? (
          <>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {role === 'Admin' ? (
              <>
                <Route path="/profile" element={<ProfileScreen />}>
                  <Route path="admin-dashboard" element={<AdminDashboardScreen />} />
                  <Route path="admin-chat/:playerId" element={<AdminChatScreen />} />
                  <Route path="*" element={<Navigate to="admin-dashboard" replace />} />
                </Route>
                <Route path="*" element={<Navigate to="/profile/admin-dashboard" replace />} />
              </>
            ) : (
              <>
                <Route path="/checkout" element={<CheckoutScreen />} />
                <Route path="/profile" element={<ProfileScreen />}>
                  <Route path="topup" element={<TopUpScreen />} />
                  <Route path="history" element={<HistoryScreen />} />
                  <Route path="missives" element={<MissivesScreen />} />
                  <Route path="support" element={<SupportChat />} />
                  <Route path="*" element={<Navigate to="topup" replace />} />
                </Route>
                <Route path="*" element={<Navigate to="/profile/topup" replace />} />
              </>
            )}
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
