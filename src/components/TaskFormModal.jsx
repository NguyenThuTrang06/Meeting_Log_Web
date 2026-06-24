import { useState } from 'react';
import { createTask } from '../services/meetingService';

const TaskFormModal = ({ isOpen, onClose, meetingId, membersList, onTaskCreated }) => {
  const [formData, setFormData] = useState({
    meeting_id: meetingId,
    name: '',
    assignee: '',
    manday: '',
    deadline: '',
    status: 'Pending'
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTask({ ...formData, meeting_id: meetingId });
      onTaskCreated();
      onClose();
      setFormData({ meeting_id: meetingId, name: '', assignee: '', manday: '', deadline: '', status: 'Pending' });
    } catch (err) {
      console.error(err);
      alert('Lỗi tạo task!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-[#8C0000]">Tạo Task Mới</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">TÊN TASK <span className="text-red-500">*</span></label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm" placeholder="Nhập tên công việc..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">NGƯỜI NHẬN VIỆC (ASSIGNEE)</label>
            <select value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm bg-white">
              <option value="">-- Chọn --</option>
              {membersList.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">MANDAY</label>
              <input type="number" step="0.1" value={formData.manday} onChange={e => setFormData({...formData, manday: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm" placeholder="VD: 0.5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">DEADLINE</label>
              <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-[#8C0000] focus:border-[#8C0000] outline-none text-sm" />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium text-sm transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-[#8C0000] hover:bg-red-900 text-white rounded font-medium text-sm transition-colors flex items-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Lưu Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
