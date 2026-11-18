import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link as RouterLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { LinkProvider } from '@astryxdesign/core/Link';
import { useAuthStore, isStaffRole } from './store/authStore';
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

type AppLinkProps = React.ComponentPropsWithoutRef<'a'> & {
  to?: string;
  ref?: React.Ref<HTMLAnchorElement>;
};

const AppLink: React.FC<AppLinkProps> = ({ href, to, ...rest }) => {
  const target = to ?? href;
  if (
    !target ||
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('mailto:')
  ) {
    return <a href={target} {...rest} />;
  }
  return <RouterLink to={target} {...rest} />;
};

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

const PostLoginRedirect: React.FC<{ isAdminOrSupport: boolean }> = ({ isAdminOrSupport }) => {
  const navigate = useNavigate();
  const { pendingRedirect, setPendingRedirect } = useAuthStore();

  useEffect(() => {
    if (isAdminOrSupport) {
      setPendingRedirect(null);
      navigate('/profile/admin-dashboard', { replace: true });
      return;
    }

    if (pendingRedirect) {
      const target = pendingRedirect;
      setPendingRedirect(null);
      navigate(target.path, { state: target.state, replace: true });
      return;
    }

    navigate('/profile/topup', { replace: true });
  }, [isAdminOrSupport, navigate, pendingRedirect, setPendingRedirect]);

  return null;
};

function App() {
  const { isLoggedIn, role } = useAuthStore();
  const isAdminOrSupport = isStaffRole(role);

  return (
    <Router>
      <LinkProvider component={AppLink}>
        <Routes>
        {/* Public payment routes (for mobile browser redirects) */}
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
              <Route path="admin-dashboard" element={<RequireAuth />} />
              <Route path="admin-chat/*" element={<RequireAuth />} />
              <Route path="*" element={<Navigate to="topup" replace />} />
            </Route>
            <Route path="/topup" element={<Navigate to="/profile/topup" replace />} />
            <Route path="/" element={<Navigate to="/profile/topup" replace />} />
            <Route path="*" element={<Navigate to="/profile/topup" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/login"
              element={<PostLoginRedirect isAdminOrSupport={isAdminOrSupport} />}
            />
            {isAdminOrSupport ? (
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
      </LinkProvider>
    </Router>
  );
}

export default App;
