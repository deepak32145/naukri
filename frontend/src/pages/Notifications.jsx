import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAllRead, markOneRead, removeNotification } from '../redux/slices/notificationSlice';
import api from '../utils/axios';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import { timeAgo } from '../utils/helpers';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const NOTIFICATION_ICONS = {
  application_update: '📋',
  new_message: '💬',
  job_alert: '🔔',
  profile_view: '👁️',
  interview_scheduled: '📅',
  new_applicant: '👤',
};

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useSelector((s) => s.notifications);

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  const handleClick = async (n) => {
    if (!n.isRead) {
      await api.put(`/notifications/${n._id}/read`);
      dispatch(markOneRead(n._id));
    }
    if (n.link) navigate(n.link);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`);
    dispatch(removeNotification(id));
    toast.success('Notification removed');
  };

  const handleMarkAll = () => dispatch(markAllRead());

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? <Spinner className="py-12" /> : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Bell size={40} className="text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-500">All caught up!</h3>
          <p className="text-sm text-gray-400 mt-1">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n._id} onClick={() => handleClick(n)}
              className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm ${!n.isRead ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-gray-100'}`}>
              <span className="text-2xl shrink-0">{NOTIFICATION_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!n.isRead ? 'text-indigo-900' : 'text-gray-800'}`}>{n.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.isRead && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                    <button onClick={(e) => handleDelete(e, n._id)} className="text-gray-300 hover:text-red-400 p-0.5"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
