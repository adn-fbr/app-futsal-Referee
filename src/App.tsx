import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { CurrentYearProvider } from "@/contexts/CurrentYearContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PublicRefereeList from "./pages/PublicRefereeList";
import PublicRefereeDetail from "./pages/PublicRefereeDetail";
import PublicReviewSubmit from "./pages/PublicReviewSubmit";
import ReviewSuccess from "./pages/ReviewSuccess";
import Signup from "./pages/Signup";
import PendingApproval from "./pages/PendingApproval";
import UserApprovals from "./pages/UserApprovals";
import PublicVerification from "./pages/PublicVerification";

// Admin pages
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventEdit from "./pages/EventEdit";
import EventSubmission from "./pages/EventSubmission";
import EventCalendar from "./pages/EventCalendar";
import Referees from "./pages/Referees";
import RefereeDetail from "./pages/RefereeDetail";
import RefereeAssignment from "./pages/RefereeAssignment";
import AdminHonorMonitoring from "./pages/AdminHonorMonitoring";
import Evaluations from "./pages/Evaluations";
import EvaluationForm from "./pages/EvaluationForm";
import EvaluationNew from "./pages/EvaluationNew";
import Organization from "./pages/Organization";
import Approvals from "./pages/Approvals";
import UserManagement from "./pages/UserManagement";
import AuditLogs from "./pages/AuditLogs";
import DatabaseExport from "./pages/DatabaseExport";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AdminLearningMaterials from "./pages/AdminLearningMaterials";
import AdminDiscussions from "./pages/AdminDiscussions";
import AdminIDCards from "./pages/AdminIDCards";
import AuthLogs from "./pages/AuthLogs";
import RefereePerformanceReport from "./pages/RefereePerformanceReport";
import EventAnalyticsReport from "./pages/EventAnalyticsReport";
import AnnualReports from "./pages/AnnualReports";
import AdminEventAssignments from "./pages/AdminEventAssignments";

// Referee pages
import RefereeDashboard from "./pages/RefereeDashboard";
import RefereeEvents from "./pages/RefereeEvents";
import RefereeHonor from "./pages/RefereeHonor";
import RefereeProfile from "./pages/RefereeProfile";
import RefereeProfileComplete from "./pages/RefereeProfileComplete";
import ProfileComplete from "./pages/ProfileComplete";
import LearningModules from "./pages/LearningModules";
import LearningMaterialDetail from "./pages/LearningMaterialDetail";
import Discussions from "./pages/Discussions";
import DiscussionDetail from "./pages/DiscussionDetail";
import DiscussionNew from "./pages/DiscussionNew";
import Notifications from "./pages/Notifications";
import RefereeIDCardPage from "./pages/RefereeIDCard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrentYearProvider>
        <NotificationProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public review routes - no auth required */}
            <Route path="/review" element={<PublicRefereeList />} />
            <Route path="/review/success" element={<ReviewSuccess />} />
            <Route path="/review/:id" element={<PublicReviewSubmit />} />
            <Route path="/review/:id/detail" element={<PublicRefereeDetail />} />
            
            {/* Public verification route */}
            <Route path="/verify/:code" element={<PublicVerification />} />

            {/* Auth routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Profile Complete - Universal for all roles */}
            <Route 
              path="/profile/complete" 
              element={
                <ProtectedRoute>
                  <ProfileComplete />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy route - redirect to new profile complete */}
            <Route 
              path="/referee/profile/complete" 
              element={
                <ProtectedRoute>
                  <ProfileComplete />
                </ProtectedRoute>
              } 
            />

            {/* Admin routes - accessible by admin_provinsi and admin_kab_kota */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "panitia"]} requireProfileComplete>
                  <Events />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:id" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "panitia"]} requireProfileComplete>
                  <EventDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/submit" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "panitia"]} requireProfileComplete>
                  <EventSubmission />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:id/edit" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "panitia"]} requireProfileComplete>
                  <EventEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/calendar" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "panitia"]} requireProfileComplete>
                  <EventCalendar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referees"
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <Referees />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referees/:id" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <RefereeDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events/:id/assign-referees" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <RefereeAssignment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/honor" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <AdminHonorMonitoring />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/evaluations" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "evaluator"]} requireProfileComplete>
                  <Evaluations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/evaluations/new" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "evaluator"]} requireProfileComplete>
                  <EvaluationNew />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/evaluations/:id" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota", "evaluator"]} requireProfileComplete>
                  <EvaluationForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organization" 
              element={
                <ProtectedRoute requireRole={["admin_provinsi", "admin_kab_kota"]} requireProfileComplete>
                  <Organization />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/approvals" 
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <Approvals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-approvals" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <UserApprovals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/audit-logs" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <AuditLogs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/auth-logs" 
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <AuthLogs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/export" 
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <DatabaseExport />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports/referee-performance" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <RefereePerformanceReport />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports/event-analytics" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <EventAnalyticsReport />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/reports/annual"
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <AnnualReports />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/learning" 
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <AdminLearningMaterials />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/discussions" 
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <AdminDiscussions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/id-cards" 
              element={
                <ProtectedRoute requireAdmin requireProfileComplete>
                  <AdminIDCards />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/administration/event-assignments"
              element={
                <ProtectedRoute requireRole="admin_provinsi" requireProfileComplete>
                  <AdminEventAssignments />
                </ProtectedRoute>
              }
            />

            {/* Referee/Wasit routes */}
            <Route 
              path="/referee" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <RefereeDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/events" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <RefereeEvents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/honor" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <RefereeHonor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/profile" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <RefereeProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/id-card" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <RefereeIDCardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/learning" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <LearningModules />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/learning/:id" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <LearningMaterialDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/discussions" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <Discussions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/discussions/new" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <DiscussionNew />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referee/discussions/:id" 
              element={
                <ProtectedRoute requireRole="wasit" requireProfileComplete>
                  <DiscussionDetail />
                </ProtectedRoute>
              } 
            />

            {/* Notifications route - accessible by all authenticated users */}
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </CurrentYearProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
