import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import UserDashboard from './user';
import ResponderDashboard from './responder';
import AdminDashboard from './admin';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      {user?.accountType === 'admin' ? (
        <AdminDashboard />
      ) : user?.accountType === 'user' ? (
        <UserDashboard />
      ) : (
        <ResponderDashboard />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
