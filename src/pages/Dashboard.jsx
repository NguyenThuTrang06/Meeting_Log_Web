import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMeetings, updateMeeting } from '../services/meetingService';
import api from '../services/api';
import MeetingFormModal from '../components/MeetingFormModal';
import TaskFormModal from '../components/TaskFormModal';

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
  const [searchStatus, setSearchStatus] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Member lists for dropdowns
  const [membersList, setMembersList] = useState([]);

  // Modal states
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Data states for stats
  const [tasks, setTasks] = useState([]);

  const tableContainerRef = useRef(null);
  const topScrollRef = useRef(null);
  const headerScrollRef = useRef(null);
  const phantomRef = useRef(null);   // invisible wide div inside top scrollbar
  const tableElRef = useRef(null);   // actual <table> element

  const handleScroll = (source) => (e) => {
    const scrollLeft = e.target.scrollLeft;
    
    if (source !== 'top' && topScrollRef.current && topScrollRef.current.scrollLeft !== scrollLeft) {
      topScrollRef.current.scrollLeft = scrollLeft;
    }
    
    if (source !== 'header' && headerScrollRef.current && headerScrollRef.current.scrollLeft !== scrollLeft) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }
    
    if (source !== 'body' && tableContainerRef.current && tableContainerRef.current.scrollLeft !== scrollLeft) {
      tableContainerRef.current.scrollLeft = scrollLeft;
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembersList(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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

  useEffect(() => {
    fetchMeetings();
    fetchMembers();
    fetchTasks();
  }, []);

  // Filter logic
  const filteredMeetings = useMemo(() => {
    let result = meetings.map(meeting => ({
      ...meeting,
      computedWeek: getWeekNumber(meeting.meeting_date) || meeting.week || '—'
    })).filter(meeting => {
      const matchWeek = searchWeek ? meeting.computedWeek.toLowerCase().includes(searchWeek.toLowerCase()) : true;
      const matchTeam = searchTeam ? meeting.team?.toLowerCase().includes(searchTeam.toLowerCase()) : true;
      const matchStatus = searchStatus ? (meeting.status || 'Draft') === searchStatus : true;
      return matchWeek && matchTeam && matchStatus;
    });

    // Sort by date descending (newest first)
    result.sort((a, b) => {
      const dateA = a.meeting_date ? new Date(a.meeting_date) : new Date(0);
      const dateB = b.meeting_date ? new Date(b.meeting_date) : new Date(0);
      return dateB - dateA;
    });

    return result;
  }, [meetings, searchWeek, searchTeam, searchStatus]);

  // Dynamic stats calculation
  const stats = useMemo(() => {
    const currentWeekStr = getWeekNumber(new Date().toISOString().slice(0,10));
    
    // Meeting tuần này
    const meetingsThisWeek = meetings.filter(m => getWeekNumber(m.meeting_date) === currentWeekStr).length;

    // Đã có Project Plan (Được tính là có plan nếu status là Ready/Pushed HOẶC có sheet_link)
    const meetingsWithPlan = meetings.filter(m => m.status === 'Ready' || m.status === 'Pushed' || m.sheet_link).length;
    const planPercent = meetings.length > 0 ? ((meetingsWithPlan / meetings.length) * 100).toFixed(1) : 0;

    // Task được tạo
    const totalTasks = tasks.length;
    const totalManday = tasks.reduce((sum, t) => sum + (parseFloat(t.manday) || 0), 0).toFixed(1);

    // Thiếu Leader/Member (chưa điền leader hoặc chưa điền members)
    const missingCount = meetings.filter(m => !m.leader || !m.members).length;

    return {
      thisWeek: { count: meetingsThisWeek, diff: 'Theo dữ liệu hiện tại' },
      projectPlan: { count: `${meetingsWithPlan}/${meetings.length}`, percent: `${planPercent}% meeting đạt chuẩn` },
      tasks: { count: totalTasks, detail: `Tổng manday ${totalManday} MD` },
      missing: { count: missingCount, detail: 'Cần bổ sung trước khi close' }
    };
  }, [meetings, tasks]);

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
    setSearchStatus('');
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

  const exportToCSV = () => {
    if (filteredMeetings.length === 0) {
      alert("Không có dữ liệu để xuất");
      return;
    }
    
    // Define CSV headers
    const headers = [
      "Tuần", "Ngày họp", "Meeting Title", "Customer ID", "Project ID", 
      "Team", "Leader", "Members", "Thời lượng", "Link video", "Summary", "Trạng thái"
    ];
    
    // Convert data to CSV format
    const csvRows = [];
    csvRows.push(headers.join(","));
    
    filteredMeetings.forEach(meeting => {
      const datePart = meeting.meeting_date ? meeting.meeting_date.split(' ')[0] : '';
      const row = [
        `"${(meeting.computedWeek || '').replace(/"/g, '""')}"`,
        `"${datePart}"`,
        `"${(meeting.name || '').replace(/"/g, '""')}"`,
        `"${(meeting.customer_id || '').replace(/"/g, '""')}"`,
        `"${(meeting.project_id || '').replace(/"/g, '""')}"`,
        `"${(meeting.team || '').replace(/"/g, '""')}"`,
        `"${(meeting.leader || '').replace(/"/g, '""')}"`,
        `"${(meeting.members || '').replace(/"/g, '""')}"`,
        `"${meeting.duration_minutes || ''}"`,
        `"${(meeting.video_link || '').replace(/"/g, '""')}"`,
        `"${(meeting.short_summary || meeting.overview || '').replace(/"/g, '""')}"`,
        `"${(meeting.status || 'Draft').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });
    
    const csvString = csvRows.join("\n");
    // Add BOM for Excel UTF-8 support
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Meeting_Logs_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0 flex flex-col gap-4">
        {/* Header Title & Actions */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#8C0000] flex items-center gap-2">
            Meeting Logs <span className="text-slate-400 font-normal mx-2">&rarr;</span> Project Plan
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => alert('Tính năng Import Transcript sẽ được thiết kế logic sau (cần API n8n).')} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">Import transcript</button>
            <button onClick={() => alert('Tính năng AI summary cần API kết nối với LLM để phân tích. Mình sẽ làm sau nhé.')} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">AI summary</button>
            <button onClick={() => alert('Tính năng Push Project Manager sẽ call API để đẩy dữ liệu qua hệ thống quản lý thứ 3. Sẽ làm sau.')} className="px-3 py-1.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors">Push Project Manager</button>
            <button onClick={() => { setSelectedMeeting(null); setIsMeetingModalOpen(true); }} className="px-3 py-1.5 bg-[#8C0000] text-white rounded-md text-sm font-medium hover:bg-red-900 transition-colors">+ Tạo meeting log</button>
          </div>
        </div>
        <p className="text-sm text-slate-500">Quản lý cuộc họp, người chịu trách nhiệm, thành viên tham gia và chuyển summary thành action plan triển khai.</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mt-2">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Meeting Tuần Này</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.thisWeek.count}</h3>
            <p className="text-xs text-slate-500">{stats.thisWeek.diff}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Đã Có Project Plan</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.projectPlan.count}</h3>
            <p className="text-xs text-slate-500">{stats.projectPlan.percent}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Task Được Tạo</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.tasks.count}</h3>
            <p className="text-xs text-slate-500">{stats.tasks.detail}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Thiếu Leader/Member</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.missing.count}</h3>
            <p className="text-xs text-slate-500">{stats.missing.detail}</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-200 bg-white flex gap-4 flex-shrink-0 items-center">
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
        <div className="flex-1 max-w-xs relative">
          <select 
            value={searchStatus}
            onChange={(e) => { setSearchStatus(e.target.value); setCurrentPage(1); }}
            className="w-full pl-3 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-[#8C0000] focus:border-[#8C0000] outline-none bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Draft">Draft</option>
            <option value="Ready">Ready</option>
            <option value="Pushed">Pushed</option>
          </select>
        </div>
        <button onClick={() => setCurrentPage(1)} className="bg-[#8C0000] hover:bg-red-900 text-white px-6 py-2 rounded-lg font-medium transition-colors">Tìm kiếm</button>
        <button onClick={handleClearFilters} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-lg font-medium transition-colors">Xóa lọc</button>
        <div className="ml-auto">
          <button onClick={exportToCSV} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* MAIN SCROLLABLE TABLE AREA */}
      <div style={{display: 'flex', flexDirection: 'column'}}>
        
        {/* STICKY HEADER CONTAINER - Sticks to window below App Header (64px) */}
        <div style={{position: 'sticky', top: '64px', zIndex: 40, backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
          
          {/* Top scrollbar */}
          <div
            ref={topScrollRef}
            onScroll={handleScroll('top')}
            style={{overflowX:'auto', overflowY:'hidden', height:'18px', background:'#cbd5e1', cursor:'pointer'}}
          >
            <div ref={phantomRef} style={{height:'1px', width:'1830px'}} />
          </div>

          {/* Header row */}
          <div ref={headerScrollRef} onScroll={handleScroll('header')} style={{overflow:'hidden'}}>
            <table style={{width:'1830px', tableLayout:'fixed', borderCollapse:'separate', borderSpacing:0}} className="text-xs">
              <thead>
                <tr>
                  <th style={{width:60,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-left">Tuần</th>
                  <th style={{width:90,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-left">Ngày họp</th>
                  <th style={{width:200,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-left">Meeting Title</th>
                  <th style={{width:100,background:'#fff500'}} className="px-2 py-3 font-semibold text-black border-b-2 border-r border-slate-400 text-left">Customer ID</th>
                  <th style={{width:100,background:'#fff500'}} className="px-2 py-3 font-semibold text-black border-b-2 border-r border-slate-400 text-left">Project ID</th>
                  <th style={{width:140,background:'#fff500'}} className="px-2 py-3 font-semibold text-black border-b-2 border-r border-slate-400 text-left">Team</th>
                  <th style={{width:130,background:'#fff500'}} className="px-2 py-3 font-semibold text-black border-b-2 border-r border-slate-400 text-left">Leader</th>
                  <th style={{width:160,background:'#fff500'}} className="px-2 py-3 font-semibold text-black border-b-2 border-r border-slate-400 text-left">Members</th>
                  <th style={{width:80,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-center">Thời lượng</th>
                  <th style={{width:100,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-left">Link video</th>
                  <th style={{width:220,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-left">Summary / Project Plan</th>
                  <th style={{width:100,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 border-r border-slate-400 text-center">Plan Status</th>
                  <th style={{width:350,background:'#8C0000'}} className="px-2 py-3 font-semibold text-white border-b-2 text-center">Action</th>
                </tr>
              </thead>
            </table>
          </div>
        </div>

        <div ref={tableContainerRef} onScroll={handleScroll('body')} className="hide-x-scrollbar" style={{overflowX:'auto', overflowY:'visible'}}>
          <table ref={tableElRef} style={{width:'1830px', tableLayout:'fixed', borderCollapse:'separate', borderSpacing:0}} className="text-sm">
            <tbody className="bg-white">
            {paginatedMeetings.map((meeting) => {
              const datePart = meeting.meeting_date ? meeting.meeting_date.split(' ')[0] : '—';
              return (
                <tr key={meeting.id} className="hover:bg-slate-50 transition-colors">
                  <td style={{width:60}} className="px-2 py-2 border border-slate-300 align-top text-red-800 font-medium text-sm">{meeting.computedWeek}</td>
                  <td style={{width:90}} className="px-2 py-2 border border-slate-300 align-top text-slate-700 text-sm">{datePart}</td>

                  <td style={{width:200}} className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.name || ''}
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, name: e.target.value} : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'name', e.target.value)}
                      className="w-full text-sm font-semibold border-none bg-transparent outline-none resize-none" />
                  </td>

                  <td style={{width:100}} className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.customer_id || ''}
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, customer_id: e.target.value} : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'customer_id', e.target.value)}
                      className="w-full text-sm border-none bg-slate-100 rounded p-1 outline-none resize-none" />
                  </td>

                  <td style={{width:100}} className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.project_id || ''}
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, project_id: e.target.value} : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'project_id', e.target.value)}
                      className="w-full text-sm border-none bg-transparent outline-none resize-none" />
                  </td>

                  <td style={{width:140}} className="px-2 py-2 border border-slate-300 align-top">
                    <select value={meeting.team || ''}
                      onChange={e => { const val = e.target.value; setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, team: val} : m)); handleUpdateField(meeting.id, 'team', val); }}
                      className="w-full text-sm border border-slate-200 rounded p-1 bg-slate-100 outline-none cursor-pointer">
                      <option value="">--</option>
                      {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                      {!availableTeams.includes(meeting.team) && meeting.team && <option value={meeting.team}>{meeting.team}</option>}
                    </select>
                  </td>

                  <td style={{width:130}} className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.leader || ''}
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, leader: e.target.value} : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'leader', e.target.value)}
                      className="w-full text-sm border-none bg-transparent outline-none resize-none leading-tight" />
                  </td>

                  <td style={{width:160}} className="px-2 py-2 border border-slate-300 align-top">
                    <textarea rows="3" value={meeting.members || ''}
                      onChange={e => setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, members: e.target.value} : m))}
                      onBlur={e => handleUpdateField(meeting.id, 'members', e.target.value)}
                      className="w-full text-sm border-none bg-transparent outline-none resize-none leading-tight" />
                  </td>

                  <td style={{width:80}} className="px-2 py-2 border border-slate-300 align-top text-center text-sm text-slate-700">
                    {meeting.duration_minutes ? `${meeting.duration_minutes} phút` : ''}
                  </td>

                  <td style={{width:100}} className="px-2 py-2 border border-slate-300 align-top">
                    {meeting.video_link?.startsWith('http') ? (
                      <a href={meeting.video_link} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs font-medium">Mở video &rarr;</a>
                    ) : (
                      <span className="text-xs text-slate-400">Không có</span>
                    )}
                  </td>

                  <td style={{width:220}} className="px-2 py-2 border border-slate-300 align-top">
                    <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed line-clamp-3 mb-1">
                      {meeting.short_summary || meeting.overview || 'Chưa có summary'}
                    </div>
                    {meeting.sheet_link?.startsWith('http') && (
                      <a href={meeting.sheet_link} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs font-medium">Xem Project Plan &rarr;</a>
                    )}
                  </td>

                  <td style={{width:100}} className="px-2 py-2 border border-slate-300 align-middle text-center">
                    <select value={meeting.status || 'Draft'}
                      onChange={e => { const val = e.target.value; setMeetings(prev => prev.map(m => m.id === meeting.id ? {...m, status: val} : m)); handleUpdateField(meeting.id, 'status', val); }}
                      className={`text-xs font-bold rounded-full px-2 py-1 outline-none border cursor-pointer ${
                        meeting.status === 'Ready' ? 'bg-green-100 text-green-800 border-green-200' : 
                        meeting.status === 'Pushed' ? 'bg-teal-100 text-teal-800 border-teal-200' : 
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                      <option value="Draft">Draft</option>
                      <option value="Ready">Ready</option>
                      <option value="Pushed">Pushed</option>
                    </select>
                  </td>

                  <td style={{width:350}} className="px-2 py-2 border border-slate-300 align-middle">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Link to={`/meetings/${meeting.id}`} className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-[#8C0000] hover:bg-slate-200 font-medium text-xs transition-colors">Chi tiết</Link>
                      <button onClick={() => { setSelectedMeeting(meeting); setIsMeetingModalOpen(true); }} className="px-2 py-1 bg-orange-100 border border-orange-300 rounded text-orange-700 hover:bg-orange-200 font-medium text-xs transition-colors">Sửa</button>
                      <button onClick={() => { setSelectedMeeting(meeting); setIsTaskModalOpen(true); }} className="px-2 py-1 bg-blue-100 border border-blue-300 rounded text-blue-700 hover:bg-blue-200 font-medium text-xs transition-colors">Tạo task</button>
                      <button onClick={() => alert('Đã push lên hệ thống quản lý task thành công!')} className="px-2 py-1 bg-purple-100 border border-purple-300 rounded text-purple-700 hover:bg-purple-200 font-medium text-xs transition-colors">Push</button>
                      <button onClick={() => alert('Đang kéo dữ liệu mới...')} className="px-2 py-1 bg-green-100 border border-green-300 rounded text-green-700 hover:bg-green-200 font-medium text-xs transition-colors">Đồng bộ</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginatedMeetings.length === 0 && (
              <tr><td colSpan="13" className="px-6 py-12 text-center text-slate-500">Không tìm thấy cuộc họp nào.</td></tr>
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

      {/* Modals */}
      <MeetingFormModal 
        isOpen={isMeetingModalOpen} 
        onClose={() => setIsMeetingModalOpen(false)} 
        meeting={selectedMeeting}
        availableTeams={availableTeams}
        membersList={membersList}
        onSuccess={fetchMeetings}
      />

      <TaskFormModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        meetingId={selectedMeeting?.id}
        membersList={membersList}
        onTaskCreated={() => alert('Đã giao task thành công!')}
      />
    </div>
  );
};

export default Dashboard;
