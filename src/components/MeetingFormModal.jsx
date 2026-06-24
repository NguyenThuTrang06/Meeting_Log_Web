import { useState, useEffect } from 'react';
import { updateMeeting, createMeeting } from '../services/meetingService';
import MultiSelect from './MultiSelect';

const MeetingFormModal = ({ isOpen, onClose, meeting, availableTeams, membersList, onSuccess }) => {
  const isEditing = !!meeting;
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (meeting) {
      setFormData(meeting);
    } else {
      setFormData({
        name: '',
        meeting_date: new Date().toISOString().slice(0,16).replace('T', ' '),
        team: '',
        leader: '',
        members: '',
        customer_id: '',
        project_id: '',
        duration_minutes: '',
        status: 'Draft',
        video_link: '',
        sheet_link: ''
      });
    }
  }, [meeting, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await updateMeeting(meeting.id, formData);
      } else {
        await createMeeting(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu meeting!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-[#8C0000]">{isEditing ? 'Sửa Cuộc Họp' : 'Tạo Cuộc Họp Mới'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">TÊN CUỘC HỌP (TITLE) <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">NGÀY HỌP</label>
              <input type="text" value={formData.meeting_date || ''} onChange={e => setFormData({...formData, meeting_date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm" placeholder="YYYY-MM-DD HH:mm:ss" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">TRẠNG THÁI PLAN (STATUS)</label>
              <select value={formData.status || 'Draft'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm bg-white">
                <option value="Draft">Draft</option>
                <option value="Ready">Ready</option>
                <option value="Pushed">Pushed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">TEAM</label>
              <select value={formData.team || ''} onChange={e => setFormData({...formData, team: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm bg-white">
                <option value="">-- Chọn Team --</option>
                {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                {!availableTeams.includes(formData.team) && formData.team && <option value={formData.team}>{formData.team}</option>}
              </select>
            </div>
            
            <div>
              <MultiSelect
                label="LEADER THAM GIA"
                options={membersList.map(m => m.name)}
                valueStr={formData.leader || ''}
                onChange={(newVal) => setFormData({...formData, leader: newVal})}
                placeholder="Chọn hoặc nhập tên..."
              />
            </div>

            <div>
              <MultiSelect
                label="MEMBER THAM GIA"
                options={membersList.map(m => m.name)}
                valueStr={formData.members || ''}
                onChange={(newVal) => setFormData({...formData, members: newVal})}
                placeholder="Chọn hoặc nhập tên..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">THỜI LƯỢNG (PHÚT)</label>
              <input type="number" value={formData.duration_minutes || ''} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">CUSTOMER ID</label>
              <input type="text" value={formData.customer_id || ''} onChange={e => setFormData({...formData, customer_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">PROJECT ID</label>
              <input type="text" value={formData.project_id || ''} onChange={e => setFormData({...formData, project_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">LINK VIDEO</label>
              <input type="url" value={formData.video_link || ''} onChange={e => setFormData({...formData, video_link: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">LINK SUMMARY</label>
              <input type="url" value={formData.sheet_link || ''} onChange={e => setFormData({...formData, sheet_link: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm" />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium text-sm transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-[#8C0000] hover:bg-red-900 text-white rounded font-medium text-sm transition-colors flex items-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Lưu Cuộc Họp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingFormModal;
