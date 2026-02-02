import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  LayoutDashboard, Users, FileText, Settings, Search, Filter, 
  Upload, Download, Menu, X, Briefcase, RefreshCw, UserCheck, Calendar,
  List, Monitor, Users as UsersIcon, BookOpen, Award, CheckSquare, Square,
  Book, PenTool, Medal, Tag, XCircle, ChevronRight
} from 'lucide-react';

// --- Constants & Color Palettes ---
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
const MONTHS_ORDER = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDXIb-gUUd3pejijQAPQpgoOambCWNo8DfUgbdisLcB9i7YDy_SQxWI4vCsePoh2p1_n0FhuEkNQjI/pub?output=csv';

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // State for Modal & Drill-down
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [clickedTopic, setClickedTopic] = useState(null); // New: Track clicked topic for drill-down

  // --- Filter States (Updated to arrays for Checkboxes) ---
  const [filters, setFilters] = useState({
    searchName: '',
    // Checkbox Filters (Empty array = Select All)
    selectedGroups: [],
    selectedPositions: [],
    selectedStartMonths: [],
    selectedDevTypes: [],
    selectedTopics: []
  });

  // --- Helper: Parse CSV Text ---
  const parseCSV = (text) => {
    const rows = text.split('\n').map(row => {
      // Improved CSV regex to handle commas inside quotes
      const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
      return row.split(regex).map(cell => cell.replace(/^"|"$/g, '').trim());
    });
    
    // Skip header row [0] and filter empty rows
    if (rows.length > 1) {
      return rows.slice(1).filter(r => r.length > 5).map((row, index) => ({
        id: index,
        year: row[0],
        department: row[2],
        group: row[3],
        name: row[4],
        position: row[5],
        evaluator: row[6],
        devType: row[7],
        topic: row[8],
        target: row[9],
        actual: row[10],
        gap: row[11],
        method70: row[12], 
        method20: row[13], 
        method10: row[14], 
        startMonth: row[15],
        endMonth: row[16],
        budget: row[17],
        kpi: row[18]?.replace('\r', '')
      }));
    }
    return [];
  };

  // --- Fetch Data from Google Sheet ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEET_CSV_URL);
      const text = await response.text();
      const parsedData = parseCSV(text);
      setData(parsedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ กรุณาตรวจสอบลิงก์หรืออินเทอร์เน็ต");
    } finally {
      setLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, []);

  // --- Derived Data for Filters (Unique Lists) ---
  const uniqueGroups = useMemo(() => [...new Set(data.map(d => d.group).filter(Boolean))], [data]);
  const uniquePositions = useMemo(() => [...new Set(data.map(d => d.position).filter(Boolean))], [data]);
  const uniqueStartMonths = useMemo(() => [...new Set(data.map(d => d.startMonth).filter(Boolean))], [data]);
  const uniqueDevTypes = useMemo(() => [...new Set(data.map(d => d.devType).filter(Boolean))], [data]);
  const uniqueTopics = useMemo(() => [...new Set(data.map(d => d.topic).filter(Boolean))], [data]);

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchName = item.name?.toLowerCase().includes(filters.searchName.toLowerCase()) ?? false;
      
      const matchGroup = filters.selectedGroups.length === 0 || filters.selectedGroups.includes(item.group);
      const matchPosition = filters.selectedPositions.length === 0 || filters.selectedPositions.includes(item.position);
      const matchStart = filters.selectedStartMonths.length === 0 || filters.selectedStartMonths.includes(item.startMonth);
      const matchDevType = filters.selectedDevTypes.length === 0 || filters.selectedDevTypes.includes(item.devType);
      const matchTopic = filters.selectedTopics.length === 0 || filters.selectedTopics.includes(item.topic);

      return matchName && matchGroup && matchPosition && matchStart && matchDevType && matchTopic;
    });
  }, [data, filters]);

  // --- Checkbox Handler ---
  const toggleCheckbox = (field, value) => {
    setFilters(prev => {
      const currentList = prev[field];
      const newList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      return { ...prev, [field]: newList };
    });
  };

  // --- Reusable Checkbox Component ---
  const FilterCheckboxList = ({ title, field, options, maxHeight = "max-h-32" }) => (
    <div className="space-y-1">
       <label className="text-xs font-medium text-slate-500">{title}</label>
       <div className={`bg-slate-50 border border-slate-200 rounded-lg p-2 ${maxHeight} overflow-y-auto custom-scrollbar`}>
          {options.map((opt, idx) => {
             const isChecked = filters[field].includes(opt);
             return (
                <div key={idx} 
                     className={`flex items-start p-1.5 rounded cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50' : 'hover:bg-slate-100'}`}
                     onClick={() => toggleCheckbox(field, opt)}
                >
                   <div className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center mr-2 transition-all ${isChecked ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300'}`}>
                      {isChecked && <CheckSquare size={12} className="text-white" />}
                   </div>
                   <span className="text-sm text-slate-700 leading-snug break-words">{opt}</span>
                </div>
             )
          })}
          {options.length === 0 && <span className="text-xs text-slate-400">ไม่มีข้อมูล</span>}
       </div>
    </div>
  );

  // --- Group Data by Person for Directory ---
  const peopleList = useMemo(() => {
    const peopleMap = new Map();
    filteredData.forEach(item => {
      if (!peopleMap.has(item.name)) {
        peopleMap.set(item.name, {
          name: item.name,
          position: item.position,
          group: item.group,
          department: item.department,
          evaluator: item.evaluator,
          courses: []
        });
      }
      peopleMap.get(item.name).courses.push(item);
    });
    return Array.from(peopleMap.values());
  }, [filteredData]);

  // --- NEW: Filtered People List for Display (based on clicked topic) ---
  const displayedPeopleList = useMemo(() => {
    if (!clickedTopic) return peopleList;
    return peopleList.filter(person => 
        person.courses.some(course => course.topic === clickedTopic)
    );
  }, [peopleList, clickedTopic]);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const totalPeople = peopleList.length;
    const totalKnowledge = filteredData.filter(d => d.devType?.includes('ความรู้')).length;
    const totalSkills = filteredData.filter(d => d.devType?.includes('ทักษะ')).length;
    const totalCompetency = filteredData.filter(d => d.devType?.includes('สมรรถนะ')).length;
    
    return { totalPeople, totalKnowledge, totalSkills, totalCompetency };
  }, [filteredData, peopleList]);

  // --- Charts Data Preparation ---
  const devTypeData = useMemo(() => {
    const counts = filteredData.reduce((acc, curr) => {
      const type = curr.devType || 'ไม่ระบุ';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [filteredData]);

  const gapData = useMemo(() => {
    const counts = { 'Gap น้อย (0-1)': 0, 'Gap ปานกลาง (2-3)': 0, 'Gap สูง (>3)': 0 };
    filteredData.forEach(d => {
      const gap = Number(d.gap || 0);
      if (gap <= 1) counts['Gap น้อย (0-1)']++;
      else if (gap <= 3) counts['Gap ปานกลาง (2-3)']++;
      else counts['Gap สูง (>3)']++;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [filteredData]);

  const monthActivityData = useMemo(() => {
    const counts = {};
    MONTHS_ORDER.forEach(m => counts[m] = 0);
    filteredData.forEach(d => {
      if (d.startMonth && counts[d.startMonth] !== undefined) counts[d.startMonth]++;
    });
    return Object.keys(counts).map(key => ({ name: key, จำนวน: counts[key] }));
  }, [filteredData]);

  // --- Aggregated Topics by Type with Person Count ---
  const topicStats = useMemo(() => {
    const stats = {};
    filteredData.forEach(item => {
      if (!stats[item.devType]) stats[item.devType] = {};
      if (!stats[item.devType][item.topic]) stats[item.devType][item.topic] = new Set();
      stats[item.devType][item.topic].add(item.name);
    });
    return stats;
  }, [filteredData]);

  // --- Render Course Card Helper with Numbering ---
  const renderCourseCard = (course, idx, colorClass, numberPrefix) => (
    <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden mb-4">
        <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`}></div>
        
        <div className="flex flex-col md:flex-row justify-between mb-4 pl-3">
            <div className="flex-1 pr-4">
                <div className="flex items-center mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    {course.devType}
                    </span>
                </div>
                <h4 className="font-bold text-slate-800 text-lg leading-tight">
                    <span className="text-slate-500 mr-2">{numberPrefix}</span>
                    {course.topic}
                </h4>
            </div>
            <div className="mt-4 md:mt-0 flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 text-right">
                <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-center bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Gap</span>
                    <span className="text-sm font-bold text-slate-700">{course.gap}</span>
                    </div>
                    <div className="flex flex-col items-center bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg">
                    <span className="text-[10px] text-indigo-400 font-semibold uppercase">Actual</span>
                    <span className="text-sm font-bold text-indigo-700">{course.actual}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* --- 70:20:10 Methodology Section --- */}
        <div className="pt-4 border-t border-slate-100 pl-3">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">รูปแบบการพัฒนา (70:20:10 Model)</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center mb-1 text-blue-700">
                        <Monitor size={14} className="mr-1.5" />
                        <span className="text-xs font-bold">70% การปฏิบัติ</span>
                    </div>
                    <p className="text-xs text-slate-700 pl-5">{course.method70 || '-'}</p>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <div className="flex items-center mb-1 text-orange-700">
                        <UsersIcon size={14} className="mr-1.5" />
                        <span className="text-xs font-bold">20% พี่เลี้ยง</span>
                    </div>
                    <p className="text-xs text-slate-700 pl-5">{course.method20 || '-'}</p>
                </div>
                
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <div className="flex items-center mb-1 text-emerald-700">
                        <BookOpen size={14} className="mr-1.5" />
                        <span className="text-xs font-bold">10% การอบรม</span>
                    </div>
                    <p className="text-xs text-slate-700 pl-5">{course.method10 || '-'}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 mt-4 border-t border-slate-100 pl-3">
            <div>
                <span className="text-slate-400 font-semibold block mb-1 flex items-center"><Calendar size={12} className="mr-1"/> ช่วงเวลาดำเนินการ (Timeline)</span>
                <p className="text-slate-700 font-medium">{course.startMonth} - {course.endMonth}</p>
                <p className="text-slate-400 mt-1">งบประมาณ: {course.budget > 0 ? `${Number(course.budget).toLocaleString()} บ.` : '-'}</p>
            </div>
            <div>
                <span className="text-slate-400 font-semibold block mb-1">ตัวชี้วัดความสำเร็จ (KPI)</span>
                <p className="text-slate-600 italic leading-relaxed">{course.kpi || '-'}</p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* --- Sidebar --- */}
      <aside 
        className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white shadow-2xl transition-all duration-300 flex flex-col z-20 overflow-hidden border-r border-slate-100 relative`}
      >
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-wide">IDP Dashboard</h1>
            <p className="text-xs text-indigo-100 opacity-80">Connected to Google Sheets</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Navigation */}
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 shadow-sm font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={20} className="mr-3" /> ภาพรวม (Overview)
            </button>
            <button 
              onClick={() => setActiveTab('list')}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-indigo-50 text-indigo-700 shadow-sm font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users size={20} className="mr-3" /> รายชื่อรวม (All List)
            </button>
          </nav>

          <hr className="border-slate-100" />

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center text-slate-800 font-semibold mb-2">
              <Filter size={18} className="mr-2 text-indigo-500" /> ตัวกรองข้อมูล
            </div>

            {/* Search Name */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="ค้นหาชื่อบุคลากร..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                value={filters.searchName}
                onChange={(e) => setFilters({...filters, searchName: e.target.value})}
              />
            </div>

            {/* Checkbox Filters */}
            <FilterCheckboxList 
               title="กลุ่มงาน (เลือกได้มากกว่า 1)" 
               field="selectedGroups" 
               options={uniqueGroups} 
            />
            
            <FilterCheckboxList 
               title="ตำแหน่ง (เลือกได้มากกว่า 1)" 
               field="selectedPositions" 
               options={uniquePositions} 
            />

            <FilterCheckboxList 
               title="เดือนเริ่มต้น (เลือกได้มากกว่า 1)" 
               field="selectedStartMonths" 
               options={uniqueStartMonths} 
            />

            <FilterCheckboxList 
               title="ประเภทการพัฒนา (เลือกได้มากกว่า 1)" 
               field="selectedDevTypes" 
               options={uniqueDevTypes} 
            />

            <FilterCheckboxList 
               title="หัวข้อการพัฒนา (เลือกได้มากกว่า 1)" 
               field="selectedTopics" 
               options={uniqueTopics} 
               maxHeight="max-h-96"
            />

          </div>

          <hr className="border-slate-100" />
          
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="mr-4 p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <Menu size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold text-slate-800">
              {activeTab === 'dashboard' ? 'ภาพรวมการพัฒนา (Overview)' : 'รายการข้อมูล (Data List)'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden md:flex flex-col text-right mr-2">
                <p className="text-sm font-semibold text-slate-700">Google Sheets Data</p>
                <p className="text-xs text-slate-500 flex items-center justify-end">
                   {lastUpdated ? `อัปเดต: ${lastUpdated.toLocaleTimeString('th-TH')}` : 'กำลังเชื่อมต่อ...'}
                </p>
             </div>
             
             <button 
               onClick={fetchData} 
               disabled={loading}
               className={`p-2 rounded-full ${loading ? 'bg-indigo-50 text-indigo-300 animate-spin' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'} transition-all`}
               title="รีเฟรชข้อมูลจาก Google Sheets"
             >
                <RefreshCw size={20} />
             </button>
             
             <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-md">
                AD
             </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 scroll-smooth">
          
          {loading ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <RefreshCw size={48} className="animate-spin mb-4 text-indigo-400" />
                <p className="text-lg font-medium text-slate-600">กำลังดึงข้อมูลจาก Google Sheets...</p>
                <p className="text-sm">กรุณารอสักครู่</p>
             </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 max-w-7xl mx-auto pb-10">
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: 'บุคลากรทั้งหมด', value: stats.totalPeople, unit: 'คน', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
                      { title: 'รวมความรู้ (Knowledge)', value: stats.totalKnowledge, unit: 'รายการ', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                      { title: 'รวมทักษะ (Skills)', value: stats.totalSkills, unit: 'รายการ', icon: Settings, color: 'text-pink-600', bg: 'bg-pink-100' },
                      { title: 'สมรรถนะ (Competency)', value: stats.totalCompetency, unit: 'รายการ', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value} <span className="text-xs font-normal text-slate-400">{stat.unit}</span></h3>
                          </div>
                          <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Bar Chart: Development Types */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                        สัดส่วนประเภทการพัฒนา (Development Types)
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={devTypeData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30} label={{ position: 'right', fill: '#64748b', fontSize: 12 }}>
                              {devTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Pie Chart: Gap Analysis */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <span className="w-1 h-6 bg-pink-500 rounded-full mr-3"></span>
                        วิเคราะห์ช่องว่างสมรรถนะ (Gap Analysis)
                      </h3>
                      <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={gapData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {gapData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#ef4444'} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                  {/* Charts Row 2 */}
                  <div className="grid grid-cols-1 gap-6">
                    {/* Area/Line Chart: Timeline */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <span className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></span>
                        ไทม์ไลน์การเริ่มต้นพัฒนา (Activity Timeline)
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthActivityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                            <YAxis allowDecimals={false} />
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Line type="monotone" dataKey="จำนวน" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* --- New Section: Topics List by Type (Grouped & Clickable) --- */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                            สรุปหัวข้อการพัฒนาตามประเภท (คลิกเพื่อกรองรายชื่อ)
                        </h3>
                        {clickedTopic && (
                           <button 
                             onClick={() => setClickedTopic(null)}
                             className="text-sm flex items-center text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                           >
                             <XCircle size={16} className="mr-1"/> ล้างตัวกรอง ({clickedTopic})
                           </button>
                        )}
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.keys(topicStats).sort().map((type, idx) => (
                           <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                              <h4 className="font-bold text-indigo-700 mb-3 text-md border-b border-indigo-100 pb-2 flex items-center">
                                 <Tag size={16} className="mr-2"/>
                                 {type} <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full">{Object.keys(topicStats[type]).length} หัวข้อ</span>
                              </h4>
                              <ul className="space-y-2">
                                 {Object.keys(topicStats[type]).sort().map((topic, i) => {
                                    const count = topicStats[type][topic].size;
                                    const isActive = clickedTopic === topic;
                                    return (
                                      <li 
                                        key={i} 
                                        onClick={() => setClickedTopic(isActive ? null : topic)}
                                        className={`text-sm flex items-start cursor-pointer transition-all p-2 rounded-lg ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
                                      >
                                         <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 mr-2 flex-shrink-0 ${isActive ? 'bg-white' : 'bg-indigo-400'}`}></span>
                                         <span className="leading-snug flex-1">
                                            {topic} 
                                            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                               {count} คน
                                            </span>
                                         </span>
                                      </li>
                                    );
                                 })}
                              </ul>
                           </div>
                        ))}
                        {Object.keys(topicStats).length === 0 && (
                           <div className="col-span-full text-center text-slate-400 py-8 border-2 border-dashed border-slate-200 rounded-xl">
                              ไม่พบข้อมูลหัวข้อการพัฒนาตามเงื่อนไขที่เลือก
                           </div>
                        )}
                     </div>
                  </div>
                  
                  {/* --- Personnel Directory (Table List - Filtered by Clicked Topic) --- */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-bold text-slate-800 flex items-center">
                         <List className="mr-2 text-indigo-600" size={24} />
                         ทำเนียบบุคลากร (Personnel Directory)
                         {clickedTopic && <span className="ml-2 text-sm font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">กรองตามหัวข้อ: "{clickedTopic}"</span>}
                         <span className="ml-2 text-sm font-normal text-slate-500 hidden sm:inline">| คลิกที่แถวเพื่อดูรายละเอียด</span>
                       </h3>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                            <tr>
                              <th className="px-6 py-4 w-16">#</th>
                              <th className="px-6 py-4">ชื่อ-สกุล</th>
                              <th className="px-6 py-4">ตำแหน่ง</th>
                              <th className="px-6 py-4">กลุ่มงาน</th>
                              <th className="px-6 py-4 text-center">แผนพัฒนา (รายการ)</th>
                              <th className="px-6 py-4 text-center">รายละเอียด</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {displayedPeopleList.length > 0 ? (
                              displayedPeopleList.map((person, idx) => (
                                <tr 
                                  key={idx}
                                  onClick={() => setSelectedPerson(person)}
                                  className="hover:bg-indigo-50 cursor-pointer transition-colors group"
                                >
                                  <td className="px-6 py-4 text-slate-400 font-medium">{idx + 1}</td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                                        {person.name.charAt(0)}
                                      </div>
                                      <span className="font-semibold text-slate-800 group-hover:text-indigo-700">{person.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-slate-600">{person.position}</td>
                                  <td className="px-6 py-4 text-slate-600">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
                                      {person.group}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                      {person.courses.length}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                                       <ChevronRight size={18} />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                   <div className="flex flex-col items-center justify-center">
                                      <Search size={32} className="mb-2 opacity-20" />
                                      ไม่พบรายชื่อบุคลากรที่เรียนหัวข้อนี้
                                   </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* List Tab */}
              {activeTab === 'list' && (
                <div className="max-w-7xl mx-auto pb-10">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <h3 className="text-lg font-bold text-slate-800">รายชื่อบุคลากรและแผนพัฒนา ({filteredData.length} รายการ)</h3>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium">
                         <Download size={16} /> <span>Export Report</span>
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                          <tr>
                            <th className="px-6 py-4">ชื่อ-สกุล</th>
                            <th className="px-6 py-4">ตำแหน่ง</th>
                            <th className="px-6 py-4">หัวข้อการพัฒนา</th>
                            <th className="px-6 py-4 text-center">Target</th>
                            <th className="px-6 py-4 text-center">Actual</th>
                            <th className="px-6 py-4 text-center">Gap</th>
                            <th className="px-6 py-4">เดือนเริ่มต้น</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredData.length > 0 ? (
                            filteredData.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                                <td className="px-6 py-4 text-slate-600">{item.position}</td>
                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={item.topic}>{item.topic}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-600 font-bold">{item.target}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-block px-2 py-1 rounded bg-indigo-50 text-indigo-600 font-bold">{item.actual}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {Number(item.gap) > 0 ? (
                                    <span className="text-red-500 font-bold">-{item.gap}</span>
                                  ) : (
                                    <span className="text-emerald-500 font-bold">OK</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                      {item.startMonth}
                                    </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center">
                                    <Search size={48} className="mb-4 opacity-20" />
                                    ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* --- Personnel Detail Modal (UPDATED WITH GROUPING & NUMBERING) --- */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col scale-100 animate-in zoom-in-95 duration-200">
             
             {/* Modal Header */}
             <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-start space-x-5">
                   <div className="h-20 w-20 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center text-white text-3xl font-bold border-4 border-white">
                      {selectedPerson.name.charAt(0)}
                   </div>
                   <div className="pt-1">
                      <h2 className="text-2xl font-bold text-slate-800">{selectedPerson.name}</h2>
                      <p className="text-slate-600 font-medium">{selectedPerson.position}</p>
                      <div className="flex flex-wrap items-center mt-2 text-sm text-slate-500 gap-3">
                         <span className="flex items-center bg-slate-100 px-2 py-1 rounded-md"><Briefcase size={14} className="mr-1.5 text-indigo-500"/> {selectedPerson.group}</span>
                         {selectedPerson.evaluator && (
                           <span className="flex items-center bg-slate-100 px-2 py-1 rounded-md"><UserCheck size={14} className="mr-1.5 text-indigo-500"/> ผู้ประเมิน: {selectedPerson.evaluator}</span>
                         )}
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedPerson(null)} 
                  className="bg-white text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all border border-slate-100 shadow-sm"
                >
                   <X size={24} />
                </button>
             </div>
             
             {/* Modal Body */}
             <div className="p-6 overflow-y-auto bg-slate-50/50 custom-scrollbar">
                
                {/* --- Group 1: Knowledge (With 1.x numbering) --- */}
                {selectedPerson.courses.some(c => c.devType.includes('ความรู้')) && (
                   <div className="mb-8">
                       <h3 className="flex items-center text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-blue-200">
                          <Book className="mr-2 text-blue-600" />
                          1. ความรู้ (Knowledge)
                          <span className="ml-3 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {selectedPerson.courses.filter(c => c.devType.includes('ความรู้')).length} รายการ
                          </span>
                       </h3>
                       <div className="space-y-4">
                          {selectedPerson.courses.filter(c => c.devType.includes('ความรู้')).map((course, idx) => 
                             renderCourseCard(course, `k-${idx}`, 'bg-blue-500', `1.${idx + 1}`)
                          )}
                       </div>
                   </div>
                )}

                {/* --- Group 2: Skills (With 2.x numbering) --- */}
                {selectedPerson.courses.some(c => c.devType.includes('ทักษะ')) && (
                   <div className="mb-8">
                       <h3 className="flex items-center text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-pink-200">
                          <PenTool className="mr-2 text-pink-600" />
                          2. ทักษะ (Skills)
                          <span className="ml-3 bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full">
                            {selectedPerson.courses.filter(c => c.devType.includes('ทักษะ')).length} รายการ
                          </span>
                       </h3>
                       <div className="space-y-4">
                          {selectedPerson.courses.filter(c => c.devType.includes('ทักษะ')).map((course, idx) => 
                             renderCourseCard(course, `s-${idx}`, 'bg-pink-500', `2.${idx + 1}`)
                          )}
                       </div>
                   </div>
                )}

                {/* --- Group 3: Competency (With 3.x numbering) --- */}
                {selectedPerson.courses.some(c => c.devType.includes('สมรรถนะ')) && (
                   <div className="mb-8">
                       <h3 className="flex items-center text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-emerald-200">
                          <Medal className="mr-2 text-emerald-600" />
                          3. สมรรถนะ (Competency)
                          <span className="ml-3 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                            {selectedPerson.courses.filter(c => c.devType.includes('สมรรถนะ')).length} รายการ
                          </span>
                       </h3>
                       <div className="space-y-4">
                          {selectedPerson.courses.filter(c => c.devType.includes('สมรรถนะ')).map((course, idx) => 
                             renderCourseCard(course, `c-${idx}`, 'bg-emerald-500', `3.${idx + 1}`)
                          )}
                       </div>
                   </div>
                )}

                {/* --- Group 4: Others (Fallback) --- */}
                {selectedPerson.courses.some(c => !c.devType.includes('ความรู้') && !c.devType.includes('ทักษะ') && !c.devType.includes('สมรรถนะ')) && (
                   <div className="mb-8">
                       <h3 className="flex items-center text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                          <FileText className="mr-2 text-slate-600" />
                          อื่นๆ (Others)
                       </h3>
                       <div className="space-y-4">
                          {selectedPerson.courses.filter(c => !c.devType.includes('ความรู้') && !c.devType.includes('ทักษะ') && !c.devType.includes('สมรรถนะ')).map((course, idx) => 
                             renderCourseCard(course, `o-${idx}`, 'bg-slate-500', `${idx + 1}`)
                          )}
                       </div>
                   </div>
                )}

             </div>
          </div>
        </div>
      )}

    </div>
  );
}
