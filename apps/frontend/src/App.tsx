import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./lib/auth";
import { Categories } from "./pages/Categories";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Transactions } from "./pages/Transactions";

function ProtectedRoute() {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicOnly() {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : <Outlet />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnly />}>
            <Route path="login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="categories" element={<Categories />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
