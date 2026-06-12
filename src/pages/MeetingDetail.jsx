import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMeetingById, updateMeeting } from '../services/meetingService';

const MeetingDetail = () => {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true);
        const data = await getMeetingById(id);
        setMeeting(data);
        setFormData({
          team: data.team || '',
          leader: data.leader || '',
          customer_id: data.customer_id || '',
          project_id: data.project_id || '',
          meeting_date: data.meeting_date || '',
          duration_minutes: data.duration_minutes || ''
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [id]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await updateMeeting(id, formData);
      setMeeting(updated);
      setIsEditing(false);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading && !meeting) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!meeting) return <div>Không tìm thấy cuộc họp</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{meeting.name}</h1>
        </div>
        <div>
          {isEditing ? (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">Hủy</button>
              <button onClick={handleSave} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Lưu</button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Chỉnh sửa thông tin
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Metadata */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Thông tin chung
            </h2>
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase">Thời gian</span>
                {isEditing ? (
                  <div className="mt-1 flex gap-2">
                    <input type="text" value={formData.meeting_date} onChange={(e) => setFormData({...formData, meeting_date: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="YYYY-MM-DD HH:mm" />
                  </div>
                ) : (
                  <span className="block text-sm text-slate-900 font-medium">{meeting.meeting_date} ({meeting.duration_minutes} phút)</span>
                )}
              </div>
              
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase">Thời lượng (phút)</span>
                {isEditing ? (
                  <input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                ) : null}
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase">Tuần</span>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{meeting.week}</span>
              </div>
              
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase">Team</span>
                {isEditing ? (
                  <input type="text" value={formData.team} onChange={(e) => setFormData({...formData, team: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="VD: Marketing" />
                ) : (
                  <span className="block text-sm text-slate-900 font-medium">{meeting.team || 'Chưa cập nhật'}</span>
                )}
              </div>
              
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase">Leader tham gia</span>
                {isEditing ? (
                  <input type="text" value={formData.leader} onChange={(e) => setFormData({...formData, leader: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="Tên Leader" />
                ) : (
                  <span className="block text-sm text-slate-900 font-medium">{meeting.leader || 'Chưa cập nhật'}</span>
                )}
              </div>
              
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase">Dự án / Khách hàng</span>
                {isEditing ? (
                  <div className="mt-1 space-y-2">
                    <input type="text" value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="Project ID" />
                    <input type="text" value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="Customer ID" />
                  </div>
                ) : (
                  <span className="block text-sm text-slate-900 font-medium">{meeting.project_id || '-'} / {meeting.customer_id || '-'}</span>
                )}
              </div>
              <div>
                <a href={meeting.video_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Xem Video Recording
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-xl">📋</span> Tổng quan
            </h2>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {meeting.overview}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-xl">✅</span> Action Items
            </h2>
            {meeting.action_items ? (
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {meeting.action_items}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Không có action items cụ thể.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-t-4 border-t-green-500">
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📌</span> Quyết định
              </h2>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {meeting.decisions || 'Không có'}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-t-4 border-t-amber-500">
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-xl">⚠️</span> Vấn đề & Rủi ro
              </h2>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {meeting.issues || 'Không có'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-t-4 border-t-blue-500">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-xl">📅</span> Bước tiếp theo
            </h2>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {meeting.next_steps || 'Không có'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;
