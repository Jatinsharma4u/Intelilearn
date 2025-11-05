import MainLayout from '../components/layout/MainLayout';

const Notifications = () => {
  return (
    <MainLayout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Notifications</h1>
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🔔</div>
          <p>No notifications yet</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Notifications;