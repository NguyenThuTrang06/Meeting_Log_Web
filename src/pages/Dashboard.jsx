import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMeetings, updateMeeting } from '../services/meetingService';
import api from '../services/api';

const getWeekNumber = (dateString) => {
  if (!dateString) return '—';
  
  // Safely parse local time (Y-m-d H:i:s -> Y-m-dTH:i:s)
  const d = new Date(dateString.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '—';
  
  // Work completely in local time to avoid UTC shift (-7 hours)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNr = (target.getDay() + 6) % 7; // 0=Monday, 6=Sunday
  target.setDate(target.getDate() - dayNr + 3); // Nearest Thursday
  
  const jan4 = new Date(target.getFullYear(), 0, 4); // ISO week 1 always contains Jan 4th
  
  // Use Math.round to mitigate any DST fraction discrepancies
  const dayDiff = Math.round((target - jan4) / 86400000);
  const weekNo = 1 + Math.ceil(dayDiff / 7);
  
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

  // Refs for syncing top scrollbar with table
  const tableContainerRef = useRef(null);
  const topScrollRef = useRef(null);
  const headerScrollRef = useRef(null);
  const phantomRef = useRef(null);   // invisible wide div inside top scrollbar
  const tableElRef = useRef(null);   // actual <table> element

  // Scroll sync: top scrollbar ↔ table container ↔ header (bidirectional)
  useEffect(() => {
    const container = tableContainerRef.current;
    const topBar    = topScrollRef.current;
    const header    = headerScrollRef.current;
    if (!container || !topBar || !header) return;

    let syncing = false;
    const onTopScroll  = () => { 
      if (syncing) return; 
      syncing = true; 
      container.scrollLeft = topBar.scrollLeft; 
      header.scrollLeft = topBar.scrollLeft;
      syncing = false; 
    };
    const onMainScroll = () => { 
      if (syncing) return; 
      syncing = true; 
      topBar.scrollLeft = container.scrollLeft; 
      header.scrollLeft = container.scrollLeft;
      syncing = false; 
    };
    const onHeaderScroll = () => {
      if (syncing) return;
      syncing = true;
      topBar.scrollLeft = header.scrollLeft;
      container.scrollLeft = header.scrollLeft;
      syncing = false;
    };

    topBar.addEventListener('scroll', onTopScroll);
    container.addEventListener('scroll', onMainScroll);
    header.addEventListener('scroll', onHeaderScroll);
    return () => {
      topBar.removeEventListener('scroll', onTopScroll);
      container.removeEventListener('scroll', onMainScroll);
      header.removeEventListener('scroll', onHeaderScroll);
    };
  }, []);

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
    'MKT', 'TECH', 'TECH & MKT',
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

  // Effect 2: sync phantom width with table AFTER every render (useLayoutEffect = synchronous, after DOM, before paint)
  useLayoutEffect(() => {
    if (phantomRef.current && tableElRef.current) {
      phantomRef.current.style.width = tableElRef.current.scrollWidth + 'px';
    }
  });

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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
        <h1 className="text-2xl font-bold text-[#8C0000] flex items-center gap-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
          Danh sách cuộc họp
        </h1>
        <span className="text-slate-500">{filteredMeetings.length} cuộc họp</span>
      </div>

      <div className="p-4 border-b border-slate-200 bg-white flex gap-4 flex-shrink-0">
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

      {/* MAIN SCROLLABLE TABLE AREA - with sticky header inside */}
      <div style={{flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        
        {/* STICKY HEADER - stays at top when scrolling down */}
        <div style={{position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', flexShrink: 0}}>

          {/* Top scrollbar */}
          <div
            ref={topScrollRef}
            style={{overflowX:'auto', overflowY:'hidden', height:'18px', background:'#cbd5e1', cursor:'pointer'}}
          >
            <div ref={phantomRef} style={{height:'1px', width:'1440px'}} />
          </div>

          {/* Header row */}
          <div ref={headerScrollRef} style={{overflow:'hidden'}}>
            <table style={{width:'1440px', tableLayout:'fixed', borderCollapse:'separate', borderSpacing:0}} className="text-xs">
              <thead>
                <tr>
                  <th style={{width:80,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-left">Tuần</th>
                  <th style={{width:100,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-left">Thời gian</th>
                  <th style={{width:130,background:'#fff500'}} className="px-2 py-3 font-semibold text-black border-b-2 border-r border-slate-400 text-left">
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      Customer ID
                    </div>
                  </th>
                  <th style={{width:120,background:'#fff500'}} className="px-2 py-3 font-semibold text-black border-b-2 border-r border-slate-400 text-left">Project ID</th>
                  <th style={{width:130,background:'#fff500'}} className="px-2 py-3 font-semibold text-black border-b-2 border-r border-slate-400 text-left">Team</th>
                  <th style={{width:170,background:'#fff500'}} className="px-2 py-3 font-semibold text-black border-b-2 border-r border-slate-400 text-left">
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      Leader tham gia họp
                    </div>
                  </th>
                  <th style={{width:110,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-center">Thời lượng</th>
                  <th style={{width:130,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-left">Link video</th>
                  <th style={{width:250,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-left">Summary</th>
                  <th style={{width:130,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-left">Link summary</th>
                  <th style={{width:90,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 text-center">Chi tiết</th>
                </tr>
              </thead>
            </table>
          </div>
        </div>

        {/* TABLE BODY - scrolls horizontally and vertically */}
        <div ref={tableContainerRef} style={{flex: 1, minHeight: 0, overflowX:'hidden', overflowY:'auto'}}>
        <table ref={tableElRef} style={{width:'1440px', tableLayout:'fixed', borderCollapse:'separate', borderSpacing:0}} className="text-sm">
          <tbody className="bg-white">
            {paginatedMeetings.map((meeting) => {
              const datePart = meeting.meeting_date ? meeting.meeting_date.split(' ')[0] : '—';
              return (
                <tr key={meeting.id} className="hover:bg-slate-50 transition-colors">
                  <td style={{width:80}} className="px-2 py-2 border border-slate-300 align-top text-red-800 font-medium text-sm">{meeting.computedWeek}</td>
                  <td style={{width:100}} className="px-2 py-2 border border-slate-300 align-top text-slate-700 text-sm">{datePart}</td>

                  <td style={{width:130}} className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.customer_id || ''}
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, customer_id: e.target.value} : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'customer_id', e.target.value)}
                      className="w-full text-sm border-none bg-slate-100 rounded p-1 outline-none resize-none" />
                  </td>

                  <td style={{width:120}} className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.project_id || ''}
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, project_id: e.target.value} : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'project_id', e.target.value)}
                      className="w-full text-sm border-none bg-transparent outline-none resize-none" />
                  </td>

                  <td style={{width:130}} className="px-2 py-2 border border-slate-300 align-top">
                    <select value={meeting.team || ''}
                      onChange={e => { const val = e.target.value; setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, team: val} : m)); handleUpdateField(meeting.id, 'team', val); }}
                      className="w-full text-sm border border-slate-200 rounded p-1 bg-slate-100 outline-none cursor-pointer">
                      <option value="">--</option>
                      {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                      {!availableTeams.includes(meeting.team) && meeting.team && <option value={meeting.team}>{meeting.team}</option>}
                    </select>
                  </td>

                  <td style={{width:170}} className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.leader || ''}
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, leader: e.target.value} : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'leader', e.target.value)}
                      className="w-full text-sm border-none bg-transparent outline-none resize-none leading-tight" />
                  </td>

                  <td style={{width:110}} className="px-2 py-2 border border-slate-300 align-top text-center text-sm text-slate-700">
                    {meeting.duration_minutes ? `${meeting.duration_minutes} phút` : ''}
                  </td>

                  <td style={{width:130}} className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.video_link || ''}
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, video_link: e.target.value} : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'video_link', e.target.value)}
                      className="w-full text-xs text-slate-600 border-none bg-transparent outline-none resize-none break-all" />
                    {meeting.video_link?.startsWith('http') && (
                      <a href={meeting.video_link} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs font-medium block mt-1">Mở video &rarr;</a>
                    )}
                  </td>

                  <td style={{width:250}} className="px-2 py-2 border border-slate-300 align-top">
                    <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {meeting.short_summary || meeting.overview || meeting.name || ''}
                    </div>
                  </td>

                  <td style={{width:130}} className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.sheet_link || ''}
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, sheet_link: e.target.value} : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'sheet_link', e.target.value)}
                      className="w-full text-xs text-slate-600 border-none bg-transparent outline-none resize-none break-all" />
                    {meeting.sheet_link?.startsWith('http') && (
                      <a href={meeting.sheet_link} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs font-medium block mt-1">Mở summary &rarr;</a>
                    )}
                  </td>

                  <td style={{width:90}} className="px-2 py-2 border border-slate-300 align-middle text-center">
                    <Link to={`/meetings/${meeting.id}`} className="text-[#8C0000] hover:text-red-900 font-medium text-xs underline">Chi tiết</Link>
                  </td>
                </tr>
              );
            })}
            {paginatedMeetings.length === 0 && (
              <tr><td colSpan="11" className="px-6 py-12 text-center text-slate-500">Không tìm thấy cuộc họp nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
        </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 flex justify-center items-center gap-2 border-t border-slate-200 flex-shrink-0">
          <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${currentPage===1?'bg-slate-100 text-slate-400 cursor-not-allowed':'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
            &larr; Trước
          </button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(page=>(
            <button key={page} onClick={()=>setCurrentPage(page)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${currentPage===page?'bg-[#8C0000] text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {page}
            </button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${currentPage===totalPages?'bg-slate-100 text-slate-400 cursor-not-allowed':'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
            Sau &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
