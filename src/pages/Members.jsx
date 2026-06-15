import { useState, useEffect } from 'react';
import api from '../services/api';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTeam, setEditTeam] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const response = await api.post('/members', { name: newName, team: newTeam });
      setMembers([...members, response.data]);
      setNewName('');
      setNewTeam('');
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return;
    try {
      await api.delete(`/members/${id}`);
      setMembers(members.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const startEditing = (member) => {
    setEditingId(member.id);
    setEditName(member.name);
    setEditTeam(member.team || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditTeam('');
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      const response = await api.put(`/members/${id}`, { name: editName, team: editTeam });
      setMembers(members.map((m) => (m.id === id ? response.data : m)));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating member:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h1 className="text-2xl font-bold text-[#8C0000] flex items-center gap-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
          Quản lý thành viên
        </h1>
        <span className="text-slate-500">{members.length} thành viên</span>
      </div>

      <div className="p-6 border-b border-slate-200">
        <h2 className="text-sm font-bold text-[#8C0000] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Thêm thành viên mới
        </h2>
        <form onSubmit={handleAddMember} className="flex gap-4 items-end">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Họ và tên"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-[#8C0000] focus:border-[#8C0000] outline-none"
              required
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Team (tuỳ chọn)"
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-[#8C0000] focus:border-[#8C0000] outline-none"
            />
          </div>
          <button type="submit" className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Thêm
          </button>
        </form>
      </div>

      <div className="overflow-x-auto p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#8C0000] text-white">
            <tr>
              <th className="px-6 py-3 font-semibold rounded-tl-lg w-16">#</th>
              <th className="px-6 py-3 font-semibold">Họ và tên</th>
              <th className="px-6 py-3 font-semibold">Team</th>
              <th className="px-6 py-3 font-semibold rounded-tr-lg w-48 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((member, index) => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {editingId === member.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1 border border-slate-300 rounded outline-none focus:border-[#8C0000]"
                    />
                  ) : (
                    member.name
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {editingId === member.id ? (
                    <input
                      type="text"
                      value={editTeam}
                      onChange={(e) => setEditTeam(e.target.value)}
                      className="w-full px-3 py-1 border border-slate-300 rounded outline-none focus:border-[#8C0000]"
                    />
                  ) : (
                    member.team || <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {editingId === member.id ? (
                      <>
                        <button onClick={() => handleUpdate(member.id)} className="bg-[#8C0000] hover:bg-red-900 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                          Lưu
                        </button>
                        <button onClick={cancelEditing} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded text-xs font-medium transition-colors">
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditing(member)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Sửa
                        </button>
                        <button onClick={() => handleDelete(member.id)} className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                  Chưa có thành viên nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Members;
