import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import Navigation from "@/components/landing/Navigation"
import HeroSection from "@/components/landing/HeroSection"
import FeaturesSection from "@/components/landing/FeaturesSection"
import HowItWorksSection from "@/components/landing/HowItWorksSection"
import SDGMissionSection from "@/components/landing/SDGMissionSection"
import CTABanner from "@/components/landing/CTABanner"
import Footer from "@/components/landing/Footer"
import LoginPage from "@/pages/LoginPage"
import ProfileCompletionForm from "@/components/auth/ProfileCompletionForm"
import SignupTypePage from "@/pages/SignupTypePage"
import ResponderTypePage from "@/pages/ResponderTypePage"
import UserSignupForm from "@/pages/UserSignupForm"
import NGOSignupForm from "@/pages/NGOSignupForm"
import GovernmentSignupForm from "@/pages/GovernmentSignupForm"
import VolunteerSignupForm from "@/pages/VolunteerSignupForm"
import Dashboard from "@/pages/dashboard/Dashboard"
import MapPage from "@/pages/dashboard/map"
import NewsPage from "@/pages/dashboard/news"
import GroupsPage from "@/pages/dashboard/groups"
import InventoryPage from "@/pages/dashboard/inventory"
import IncidentsPage from "@/pages/dashboard/incidents"
import UserIncidentsPage from "@/pages/dashboard/user/incidents"
import DonatePage from "@/pages/dashboard/user/donate"
import DonationsPage from "@/pages/dashboard/donations"
import MyIncidentsPage from "@/pages/dashboard/user/my-incidents"
import SOSReportsPage from "@/pages/dashboard/sos-reports"
import MyReportsPage from "@/pages/dashboard/user/my-reports"
import TeamPage from "@/pages/dashboard/team"

function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation onLoginClick={onLoginClick} />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SDGMissionSection />
      <CTABanner />
      <Footer />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [skipProfileCompletion, setSkipProfileCompletion] = useState(false);

  // Reset skipProfileCompletion when user changes (login/logout)
  useEffect(() => {
    setSkipProfileCompletion(false);
  }, [user?.email]);

  // Store credentials in sessionStorage if user needs profile completion
  useEffect(() => {
    if (isAuthenticated && user && user.needsProfileCompletion && !skipProfileCompletion) {
      const storedUsers = localStorage.getItem('ricos_users');
      if (storedUsers) {
        try {
          const users = JSON.parse(storedUsers);
          if (Array.isArray(users)) {
            const foundUser = users.find((u: any) => u.email === user.email);
            if (foundUser && foundUser.password) {
              sessionStorage.setItem('signup_email', foundUser.email);
              sessionStorage.setItem('signup_password', foundUser.password);
            }
          }
        } catch (e) {
          console.error('Error loading user credentials:', e);
        }
      }
    }
  }, [isAuthenticated, user, skipProfileCompletion]);

  // Old profile completion form for backward compatibility
  if (isAuthenticated && user && !user.isProfileComplete && !user.needsProfileCompletion && !skipProfileCompletion) {
    return <ProfileCompletionForm onComplete={() => setSkipProfileCompletion(true)} />;
  }

  // Determine redirect route for profile completion
  let profileRedirect = null;
  if (isAuthenticated && user && user.needsProfileCompletion && !skipProfileCompletion) {
    if (user.accountType === 'user') {
      profileRedirect = '/signup/user';
    } else if (user.accountType === 'responder') {
      if (user.responderType === 'ngo') {
        profileRedirect = '/signup/responder/ngo';
      } else if (user.responderType === 'government') {
        profileRedirect = '/signup/responder/government';
      } else if (user.responderType === 'volunteer') {
        profileRedirect = '/signup/responder/volunteer';
      }
    }
  }

  return (
    <Routes>
      {/* Main route - Dashboard if logged in, Landing page if not */}
      <Route 
        path="/" 
        element={
          isAuthenticated && user && !user.needsProfileCompletion ? (
            <Dashboard />
          ) : isAuthenticated ? (
            profileRedirect ? <Navigate to={profileRedirect} replace /> : <Dashboard />
          ) : (
            <LandingPage onLoginClick={() => window.location.href = '/login'} />
          )
        } 
      />
      
      {/* Dashboard sub-routes */}
      <Route 
        path="/dashboard" 
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/map" 
        element={isAuthenticated ? <MapPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/news" 
        element={isAuthenticated ? <NewsPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/incidents" 
        element={isAuthenticated ? <IncidentsPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/groups" 
        element={isAuthenticated ? <GroupsPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/inventory" 
        element={isAuthenticated ? <InventoryPage /> : <Navigate to="/login" replace />} 
      />
      
      {/* User-specific Routes */}
      <Route 
        path="/user/incidents" 
        element={isAuthenticated ? <UserIncidentsPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/user/donate" 
        element={isAuthenticated ? <DonatePage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/user/my-incidents" 
        element={isAuthenticated ? <MyIncidentsPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/user/my-reports" 
        element={isAuthenticated ? <MyReportsPage /> : <Navigate to="/login" replace />} 
      />
      {/* Responder Donations Dashboard */}
      <Route 
        path="/dashboard/donations" 
        element={isAuthenticated ? <DonationsPage /> : <Navigate to="/login" replace />} 
      />
      
      {/* Responder SOS Reports */}
      <Route 
        path="/dashboard/sos-reports" 
        element={isAuthenticated ? <SOSReportsPage /> : <Navigate to="/login" replace />} 
      />

      {/* Field team mission view */}
      <Route
        path="/dashboard/team"
        element={isAuthenticated ? <TeamPage /> : <Navigate to="/login" replace />}
      />
      
      {/* Auth Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated && user && !user.needsProfileCompletion ? (
            <Navigate to="/" replace />
          ) : profileRedirect ? (
            <Navigate to={profileRedirect} replace />
          ) : (
            <LoginPage />
          )
        } 
      />
      
      {/* Signup Routes */}
      <Route path="/signup" element={<SignupTypePage />} />
      <Route path="/signup/user" element={<UserSignupForm />} />
      <Route path="/signup/responder-type" element={<ResponderTypePage />} />
      <Route path="/signup/responder/ngo" element={<NGOSignupForm />} />
      <Route path="/signup/responder/government" element={<GovernmentSignupForm />} />
      <Route path="/signup/responder/volunteer" element={<VolunteerSignupForm />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/test" element={<SignupTypePage />} />

    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App