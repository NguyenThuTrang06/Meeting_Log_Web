import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const MeetingDetail = () => {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchMeetingDetail();
    fetchMembers();
  }, [id]);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembersList(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchMeetingDetail = async () => {
    try {
      const response = await api.get(`/meetings/${id}`);
      setMeeting(response.data);
      setEditData(response.data);
    } catch (error) {
      console.error('Error fetching meeting detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/meetings/${id}`, editData);
      setMeeting(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating meeting:', error);
      alert('Có lỗi xảy ra khi cập nhật!');
    }
  };

  // Get unique teams from members list and predefined teams
  const availableTeams = [...new Set([
    'MKT', 'TECH', 'Cả team',
    ...membersList.map(m => m.team).filter(Boolean)
  ])].sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C0000]"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-slate-900">Không tìm thấy cuộc họp</h3>
        <Link to="/" className="text-[#8C0000] hover:underline mt-2 inline-block">Quay lại danh sách</Link>
      </div>
    );
  }

  // Format date correctly if possible
  const datePart = meeting.meeting_date ? meeting.meeting_date.split(' ')[0] : '—';

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-[#8C0000] hover:text-red-900 mb-6 transition-colors">
        <span className="mr-1">&larr;</span> Quay lại danh sách
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#8C0000] flex items-center gap-2">
          <svg className="w-6 h-6 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
          Chi tiết cuộc họp
        </h1>
        <div className="flex gap-3 items-center">
          {meeting.week && (
            <span className="bg-red-50 text-red-800 border border-red-100 px-4 py-1.5 rounded-full text-sm font-semibold">
              {meeting.week}
            </span>
          )}
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Sửa
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdateMeeting} className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2">Chỉnh sửa thông tin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">TÊN CUỘC HỌP / NỘI DUNG</label>
              <input type="text" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">NGÀY HỌP</label>
              <input type="text" value={editData.meeting_date || ''} onChange={e => setEditData({...editData, meeting_date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">TEAM</label>
              <select value={editData.team || ''} onChange={e => setEditData({...editData, team: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500 outline-none bg-white">
                <option value="">-- Chọn Team --</option>
                {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                {!availableTeams.includes(editData.team) && editData.team && <option value={editData.team}>{editData.team}</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">LEADER THAM GIA</label>
              <select value={editData.leader || ''} onChange={e => setEditData({...editData, leader: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500 outline-none bg-white">
                <option value="">-- Chọn Leader --</option>
                {membersList.map(m => <option key={m.id} value={m.name}>{m.name} {m.team ? `(${m.team})` : ''}</option>)}
                {!membersList.find(m => m.name === editData.leader) && editData.leader && <option value={editData.leader}>{editData.leader}</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">TUẦN</label>
              <input type="text" value={editData.week || ''} onChange={e => setEditData({...editData, week: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">THỜI LƯỢNG (PHÚT)</label>
              <input type="number" value={editData.duration_minutes || ''} onChange={e => setEditData({...editData, duration_minutes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium transition-colors">Lưu thay đổi</button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
        {/* Thông tin chung Box */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-[#8C0000] mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
              Thông tin chung
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 mb-8">
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">NGÀY HỌP</span>
                <span className="block text-sm text-slate-900 font-medium">{datePart}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">THỜI LƯỢNG</span>
                <span className="inline-block bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded text-sm font-semibold">
                  {meeting.duration_minutes || 0} phút
                </span>
              </div>
              
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">TEAM</span>
                <span className="block text-sm text-slate-900 font-medium">{meeting.team || '—'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">LEADER THAM GIA</span>
                <span className="block text-sm text-slate-900 font-medium">{meeting.leader || '—'}</span>
              </div>
              
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">CUSTOMER ID</span>
                <span className="block text-sm text-slate-900 font-medium">{meeting.customer_id || '—'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">PROJECT ID</span>
                <span className="block text-sm text-slate-900 font-medium">{meeting.project_id || '—'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
              <a href={meeting.video_link || '#'} target="_blank" rel="noopener noreferrer" className="bg-[#8C0000] hover:bg-red-900 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                Xem video họp
              </a>
              <a href={meeting.sheet_link || '#'} target="_blank" rel="noopener noreferrer" className="bg-[#188038] hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                Xem summary gốc (Google Sheet)
              </a>
            </div>
          </div>
        </div>

        {/* Tóm tắt nội dung Box */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-[#8C0000] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
              Tóm tắt nội dung cuộc họp
            </h2>
            <div className="bg-red-50/50 border-l-4 border-[#8C0000] p-4 rounded-r-lg">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {meeting.short_summary || meeting.overview || 'Không có tóm tắt.'}
              </p>
            </div>
          </div>
        </div>
        
        {meeting.action_items && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-[#8C0000] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Action Items
            </h2>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {meeting.action_items}
            </div>
          </div>
        )}

        </div>
      )}
    </div>
  );
};

export default MeetingDetail;
