import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMeetings } from '../services/meetingService';

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

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await getMeetings();
      // If backend is paginated, it might be in response.data.data
      const dataArray = response.data.data ? response.data.data : response.data;
      setMeetings(dataArray || []);
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
              <th className="px-4 py-3 font-semibold rounded-tl-lg w-12 text-center">#</th>
              <th className="px-4 py-3 font-semibold w-20">Tuần</th>
              <th className="px-4 py-3 font-semibold w-32">Ngày họp</th>
              <th className="px-4 py-3 font-semibold">Nội dung tóm tắt</th>
              <th className="px-4 py-3 font-semibold w-32">Team</th>
              <th className="px-4 py-3 font-semibold w-48">Leader</th>
              <th className="px-4 py-3 font-semibold w-24 text-center">Thời lượng</th>
              <th className="px-4 py-3 font-semibold rounded-tr-lg w-20 text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedMeetings.map((meeting, index) => {
              // Extract date part correctly if it has time
              const datePart = meeting.meeting_date ? meeting.meeting_date.split(' ')[0] : '—';
              
              return (
                <tr key={meeting.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-center text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-4 py-4 font-medium text-red-800">{meeting.week || '—'}</td>
                  <td className="px-4 py-4 text-slate-600">{datePart}</td>
                  <td className="px-4 py-4 text-slate-800">
                    <div className="whitespace-normal line-clamp-2" title={meeting.name}>{meeting.name || meeting.short_summary || '—'}</div>
                  </td>
                  <td className="px-4 py-4">
                    {meeting.team ? (
                      <span className="inline-block bg-green-100 text-green-800 px-2.5 py-0.5 rounded text-xs font-semibold">
                        {meeting.team}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-xs">
                    {meeting.leader || '—'}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-blue-600">{meeting.duration_minutes || 0}</span>
                    <span className="text-xs text-slate-500 ml-1">phút</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Link to={`/meetings/${meeting.id}`} className="inline-block bg-[#8C0000] hover:bg-red-900 text-white font-medium px-4 py-1.5 rounded-md transition-colors text-xs">
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
