import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMeetings } from '../services/meetingService';

const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await getMeetings();
      // Laravel pagination returns data in response.data (axios payload) -> .data (Laravel paginator array)
      const dataArray = response.data.data ? response.data.data : response.data;
      setMeetings(dataArray || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách cuộc họp.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meeting Dashboard</h1>
          <p className="text-slate-500 mt-1">Danh sách các cuộc họp đã được ghi lại và phân tích.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tuần</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Thời gian</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên cuộc họp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Team / Leader</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tóm tắt</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {meetings.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {meeting.week}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div>{meeting.meeting_date ? meeting.meeting_date.split(' ')[0] : 'N/A'}</div>
                    <div className="text-xs text-slate-400">
                      {meeting.meeting_date && meeting.meeting_date.split(' ')[1] ? meeting.meeting_date.split(' ')[1] + ' • ' : ''} 
                      {meeting.duration_minutes || 0} phút
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 max-w-sm">
                    <div className="whitespace-normal line-clamp-2">{meeting.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div className="font-medium text-slate-900">{meeting.team || '-'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{meeting.leader || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                    <div className="whitespace-normal line-clamp-3">{meeting.short_summary}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/meetings/${meeting.id}`} className="text-blue-600 hover:text-blue-900 font-semibold bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
              {meetings.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    Chưa có cuộc họp nào được ghi lại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
