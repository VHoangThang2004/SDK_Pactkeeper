import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { LinkProvider } from '@astryxdesign/core/Link';
import { RouterLinkAdapter } from './components/RouterLinkAdapter';
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './features/auth/LoginScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { TopUpScreen } from './features/profile/TopUpScreen';
import { HistoryScreen } from './features/profile/HistoryScreen';
import { MissivesScreen } from './features/profile/MissivesScreen';
import { SupportChat } from './features/support/SupportChat';
import { CheckoutScreen } from './features/payment/CheckoutScreen';
import { PaymentResultScreen } from './features/payment/PaymentResultScreen';

const RequireAuth: React.FC = () => {
  const location = useLocation();
  const setPendingRedirect = useAuthStore((s) => s.setPendingRedirect);

  useEffect(() => {
    setPendingRedirect({
      path: `${location.pathname}${location.search}`,
      state: location.state,
    });
  }, [location.pathname, location.search, location.state, setPendingRedirect]);

  return <Navigate to="/login" replace />;
};

const PostLoginRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { pendingRedirect, setPendingRedirect } = useAuthStore();

  useEffect(() => {
    if (pendingRedirect) {
      const target = pendingRedirect;
      setPendingRedirect(null);
      navigate(target.path, { state: target.state, replace: true });
      return;
    }

    navigate('/profile/topup', { replace: true });
  }, [navigate, pendingRedirect, setPendingRedirect]);

  return null;
};

function App() {
  const { isLoggedIn } = useAuthStore();

  return (
    <Router>
      <LinkProvider component={RouterLinkAdapter}>
        <Routes>
          {/* Public payment callback routes (for mobile browser redirects) */}
          <Route path="/payment/success" element={<PaymentResultScreen isSuccess={true} />} />
          <Route path="/payment/cancel" element={<PaymentResultScreen isSuccess={false} />} />

          {!isLoggedIn ? (
            <>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/checkout" element={<RequireAuth />} />
              <Route path="/profile" element={<ProfileScreen />}>
                <Route index element={<Navigate to="topup" replace />} />
                <Route path="topup" element={<TopUpScreen />} />
                <Route path="history" element={<RequireAuth />} />
                <Route path="missives" element={<RequireAuth />} />
                <Route path="support" element={<RequireAuth />} />
                <Route path="*" element={<Navigate to="topup" replace />} />
              </Route>
              <Route path="/topup" element={<Navigate to="/profile/topup" replace />} />
              <Route path="/" element={<Navigate to="/profile/topup" replace />} />
              <Route path="*" element={<Navigate to="/profile/topup" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<PostLoginRedirect />} />
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
        </Routes>
      </LinkProvider>
    </Router>
  );
}

export default App;
