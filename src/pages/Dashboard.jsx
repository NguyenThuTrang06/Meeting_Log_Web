import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMeetings, updateMeeting } from '../services/meetingService';
import api from '../services/api';

const getWeekNumber = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `Tuần ${weekNo}`;
};

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
    let result = meetings.map(meeting => ({
      ...meeting,
      computedWeek: getWeekNumber(meeting.meeting_date) || meeting.week || '—'
    })).filter(meeting => {
      const matchWeek = searchWeek ? meeting.computedWeek.toLowerCase().includes(searchWeek.toLowerCase()) : true;
      const matchTeam = searchTeam ? meeting.team?.toLowerCase().includes(searchTeam.toLowerCase()) : true;
      return matchWeek && matchTeam;
    });

    // Sort by date descending (newest first)
    result.sort((a, b) => {
      const dateA = a.meeting_date ? new Date(a.meeting_date) : new Date(0);
      const dateB = b.meeting_date ? new Date(b.meeting_date) : new Date(0);
      return dateB - dateA;
    });

    return result;
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
        <table className="w-full text-left text-sm border-collapse">
          <thead className="text-xs">
            <tr>
              <th className="px-2 py-3 font-semibold bg-[#8C0000] text-white border border-slate-300 w-20">Tuần</th>
              <th className="px-2 py-3 font-semibold bg-[#8C0000] text-white border border-slate-300 w-24">Thời gian</th>
              <th className="px-2 py-3 font-semibold bg-[#fff500] text-black border border-slate-300 w-32">
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Customer ID
                </div>
              </th>
              <th className="px-2 py-3 font-semibold bg-[#fff500] text-black border border-slate-300 w-32">Project ID</th>
              <th className="px-2 py-3 font-semibold bg-[#fff500] text-black border border-slate-300 w-24">Team</th>
              <th className="px-2 py-3 font-semibold bg-[#fff500] text-black border border-slate-300 w-40">
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Leader tham gia họp
                </div>
              </th>
              <th className="px-2 py-3 font-semibold bg-[#8C0000] text-white border border-slate-300 w-20 text-center">Thời lượng</th>
              <th className="px-2 py-3 font-semibold bg-[#8C0000] text-white border border-slate-300 w-32">Link video</th>
              <th className="px-2 py-3 font-semibold bg-[#8C0000] text-white border border-slate-300 min-w-[200px]">Summary</th>
              <th className="px-2 py-3 font-semibold bg-[#8C0000] text-white border border-slate-300 w-32">Link summary</th>
              <th className="px-2 py-3 font-semibold bg-[#8C0000] text-white border border-slate-300 w-16 text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {paginatedMeetings.map((meeting, index) => {
              // Extract date part correctly if it has time
              const datePart = meeting.meeting_date ? meeting.meeting_date.split(' ')[0] : '—';
              
              return (
                <tr key={meeting.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-2 border border-slate-300 align-top text-red-800 font-medium text-sm">
                    {meeting.computedWeek}
                  </td>
                  <td className="px-2 py-2 border border-slate-300 align-top text-slate-700 text-sm">{datePart}</td>
                  
                  <td className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.customer_id || ''} 
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, customer_id: e.target.value } : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'customer_id', e.target.value)}
                      className="w-full h-full text-sm border-none bg-transparent outline-none resize-none bg-slate-100 rounded p-1" />
                  </td>
                  <td className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.project_id || ''} 
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, project_id: e.target.value } : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'project_id', e.target.value)}
                      className="w-full h-full text-sm border-none bg-transparent outline-none resize-none" />
                  </td>
                  
                  <td className="px-2 py-2 border border-slate-300 align-top">
                    <select value={meeting.team || ''} 
                      onChange={e => {
                        const val = e.target.value;
                        setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, team: val } : m));
                        handleUpdateField(meeting.id, 'team', val);
                      }}
                      className="w-full text-sm border border-slate-200 rounded p-1 bg-slate-100 outline-none cursor-pointer">
                      <option value="">--</option>
                      {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                      {!availableTeams.includes(meeting.team) && meeting.team && <option value={meeting.team}>{meeting.team}</option>}
                    </select>
                  </td>
                  
                  <td className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.leader || ''} 
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, leader: e.target.value } : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'leader', e.target.value)}
                      className="w-full h-full text-sm border-none bg-transparent outline-none resize-none leading-tight" />
                  </td>
                  
                  <td className="px-2 py-2 border border-slate-300 align-top text-center text-sm text-slate-700">
                    {meeting.duration_minutes ? `${meeting.duration_minutes} phút` : ''}
                  </td>
                  
                  <td className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.video_link || ''} 
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, video_link: e.target.value } : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'video_link', e.target.value)}
                      className="w-full h-full text-xs text-slate-600 border-none bg-transparent outline-none resize-none break-all" />
                    {meeting.video_link && meeting.video_link.startsWith('http') && (
                      <a href={meeting.video_link} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs font-medium block mt-1">
                        Mở video &rarr;
                      </a>
                    )}
                  </td>
                  
                  <td className="px-2 py-2 border border-slate-300 align-top">
                    <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {meeting.short_summary || meeting.overview || meeting.name || ''}
                    </div>
                  </td>

                  <td className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.sheet_link || ''} 
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, sheet_link: e.target.value } : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'sheet_link', e.target.value)}
                      className="w-full h-full text-xs text-slate-600 border-none bg-transparent outline-none resize-none break-all" />
                    {meeting.sheet_link && meeting.sheet_link.startsWith('http') && (
                      <a href={meeting.sheet_link} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs font-medium block mt-1">
                        Mở summary &rarr;
                      </a>
                    )}
                  </td>
                  
                  <td className="px-2 py-2 border border-slate-300 align-middle text-center">
                    <Link to={`/meetings/${meeting.id}`} className="inline-block text-[#8C0000] hover:text-red-900 font-medium px-2 py-1 transition-colors text-xs underline">
                      Chi tiết
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
