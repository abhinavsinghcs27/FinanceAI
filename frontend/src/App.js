import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import UploadPage from "./pages/UploadPage";
import RiskAnalysisPage from "./pages/RiskAnalysisPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import ReportsPage from "./pages/ReportsPage";
import AIChatPage from "./pages/AIChatPage";
import InfoPage from "./pages/InfoPage";
import { getAuthToken } from "./lib/api";

function RequireAuth({ children }) {
  if (!getAuthToken()) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function PublicAuthRoute() {
  return getAuthToken() ? <Navigate to="/dashboard" replace /> : <AuthPage />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<PublicAuthRoute />} />
        <Route path="/login" element={<PublicAuthRoute />} />
        <Route path="/signup" element={<PublicAuthRoute />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/upload"
          element={
            <RequireAuth>
              <UploadPage />
            </RequireAuth>
          }
        />
        <Route
          path="/risk"
          element={
            <RequireAuth>
              <RiskAnalysisPage />
            </RequireAuth>
          }
        />
        <Route
          path="/stocks"
          element={
            <RequireAuth>
              <RecommendationsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <ReportsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/assistant"
          element={
            <RequireAuth>
              <AIChatPage />
            </RequireAuth>
          }
        />
        <Route path="/info/:slug" element={<InfoPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
