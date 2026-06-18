import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMeetings, updateMeeting } from '../services/meetingService';
import api from '../services/api';

const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchWeek, setSearchWeek] = useState('');
  const [searchTeam, setSearchTeam] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Member lists for dropdowns
  const [membersList, setMembersList] = useState([]);

  useEffect(() => {
    fetchMeetings();
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembersList(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleUpdateField = async (id, field, value) => {
    try {
      await updateMeeting(id, { [field]: value });
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const availableTeams = [...new Set([
    'MKT', 'TECH', 'Cả team',
    ...membersList.map(m => m.team).filter(Boolean)
  ])].sort();

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await getMeetings();
      let dataArray = [];
      if (Array.isArray(response)) {
        dataArray = response;
      } else if (response && response.data) {
        dataArray = response.data;
      }
      setMeetings(dataArray);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách cuộc họp.');
      setLoading(false);
    }
  };

  // Filter logic
  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => {
      const matchWeek = searchWeek ? meeting.week?.toLowerCase().includes(searchWeek.toLowerCase()) : true;
      const matchTeam = searchTeam ? meeting.team?.toLowerCase().includes(searchTeam.toLowerCase()) : true;
      return matchWeek && matchTeam;
    });
  }, [meetings, searchWeek, searchTeam]);

  // Pagination logic
  const totalPages = Math.ceil(filteredMeetings.length / itemsPerPage);
  const paginatedMeetings = filteredMeetings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClearFilters = () => {
    setSearchWeek('');
    setSearchTeam('');
    setCurrentPage(1);
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h1 className="text-2xl font-bold text-[#8C0000] flex items-center gap-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
          Danh sách cuộc họp
        </h1>
        <span className="text-slate-500">{filteredMeetings.length} cuộc họp</span>
      </div>

      <div className="p-4 border-b border-slate-200 bg-white flex gap-4">
        <div className="flex-1 max-w-xs relative">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Lọc theo tuần (VD: Tuần 24)" 
            value={searchWeek}
            onChange={(e) => { setSearchWeek(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-[#8C0000] focus:border-[#8C0000] outline-none" 
          />
        </div>
        <div className="flex-1 max-w-xs relative">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Lọc theo team" 
            value={searchTeam}
            onChange={(e) => { setSearchTeam(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-[#8C0000] focus:border-[#8C0000] outline-none" 
          />
        </div>
        <button onClick={() => setCurrentPage(1)} className="bg-[#8C0000] hover:bg-red-900 text-white px-6 py-2 rounded-lg font-medium transition-colors">Tìm kiếm</button>
        <button onClick={handleClearFilters} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-lg font-medium transition-colors">Xóa lọc</button>
      </div>

      <div className="overflow-x-auto p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#8C0000] text-white">
            <tr>
              <th className="px-2 py-3 font-semibold rounded-tl-lg w-10 text-center">#</th>
              <th className="px-2 py-3 font-semibold w-24">Tuần</th>
              <th className="px-2 py-3 font-semibold w-24">Ngày họp</th>
              <th className="px-2 py-3 font-semibold min-w-[160px]">Nội dung tóm tắt</th>
              <th className="px-2 py-3 font-semibold w-24">Cust. ID</th>
              <th className="px-2 py-3 font-semibold w-24">Proj. ID</th>
              <th className="px-2 py-3 font-semibold w-28">Team</th>
              <th className="px-2 py-3 font-semibold w-28">Leader</th>
              <th className="px-2 py-3 font-semibold w-28">Member</th>
              <th className="px-2 py-3 font-semibold w-16 text-center">Phút</th>
              <th className="px-2 py-3 font-semibold rounded-tr-lg w-16 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedMeetings.map((meeting, index) => {
              // Extract date part correctly if it has time
              const datePart = meeting.meeting_date ? meeting.meeting_date.split(' ')[0] : '—';
              
              return (
                <tr key={meeting.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-3 text-center text-slate-500 text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-2 py-3">
                    <input type="text" value={meeting.week || ''} 
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, week: e.target.value } : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'week', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-transparent hover:border-slate-300 focus:border-red-500 rounded bg-transparent focus:bg-white outline-none text-red-800 font-medium placeholder-slate-300" placeholder="Trống" />
                  </td>
                  <td className="px-2 py-3 text-slate-600 text-sm whitespace-nowrap">{datePart}</td>
                  <td className="px-2 py-3 text-slate-800 text-sm">
                    <div className="whitespace-normal line-clamp-2" title={meeting.name}>{meeting.name || meeting.short_summary || '—'}</div>
                  </td>
                  <td className="px-2 py-3">
                    <input type="text" value={meeting.customer_id || ''} 
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, customer_id: e.target.value } : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'customer_id', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-transparent hover:border-slate-300 focus:border-red-500 rounded bg-transparent focus:bg-white outline-none placeholder-slate-300" placeholder="ID KH" />
                  </td>
                  <td className="px-2 py-3">
                    <input type="text" value={meeting.project_id || ''} 
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, project_id: e.target.value } : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'project_id', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-transparent hover:border-slate-300 focus:border-red-500 rounded bg-transparent focus:bg-white outline-none placeholder-slate-300" placeholder="ID Dự án" />
                  </td>
                  <td className="px-2 py-3">
                    <select value={meeting.team || ''} 
                      onChange={e => {
                        const val = e.target.value;
                        setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, team: val } : m));
                        handleUpdateField(meeting.id, 'team', val);
                      }}
                      className="w-full px-1 py-1.5 text-sm border border-transparent hover:border-slate-300 focus:border-red-500 rounded bg-transparent focus:bg-white outline-none cursor-pointer">
                      <option value="">--</option>
                      {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                      {!availableTeams.includes(meeting.team) && meeting.team && <option value={meeting.team}>{meeting.team}</option>}
                    </select>
                  </td>
                  <td className="px-2 py-3">
                    <select value={meeting.leader || ''} 
                      onChange={e => {
                        const val = e.target.value;
                        setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, leader: val } : m));
                        handleUpdateField(meeting.id, 'leader', val);
                      }}
                      className="w-full px-1 py-1.5 text-sm border border-transparent hover:border-slate-300 focus:border-red-500 rounded bg-transparent focus:bg-white outline-none cursor-pointer">
                      <option value="">--</option>
                      {membersList.map(m => <option key={`l-${m.id}`} value={m.name}>{m.name}</option>)}
                      {!membersList.find(m => m.name === meeting.leader) && meeting.leader && <option value={meeting.leader}>{meeting.leader}</option>}
                    </select>
                  </td>
                  <td className="px-2 py-3">
                    <select value={meeting.members || ''} 
                      onChange={e => {
                        const val = e.target.value;
                        setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, members: val } : m));
                        handleUpdateField(meeting.id, 'members', val);
                      }}
                      className="w-full px-1 py-1.5 text-sm border border-transparent hover:border-slate-300 focus:border-red-500 rounded bg-transparent focus:bg-white outline-none cursor-pointer">
                      <option value="">--</option>
                      {membersList.map(m => <option key={`m-${m.id}`} value={m.name}>{m.name}</option>)}
                      {!membersList.find(m => m.name === meeting.members) && meeting.members && <option value={meeting.members}>{meeting.members}</option>}
                    </select>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="font-semibold text-blue-600 text-sm">{meeting.duration_minutes || 0}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <Link to={`/meetings/${meeting.id}`} className="inline-block text-[#8C0000] hover:text-red-900 font-medium px-2 py-1 rounded transition-colors text-xs underline">
                      Xem
                    </Link>
                  </td>
                </tr>
              );
            })}
            {paginatedMeetings.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-slate-500 bg-slate-50 rounded-b-xl">
                  Không tìm thấy cuộc họp nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
            >
              &larr; Trước
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${currentPage === page ? 'bg-[#8C0000] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {page}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
            >
              Sau &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
