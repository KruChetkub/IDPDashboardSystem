import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import IDPPrintForm from '../IDPPrintForm'; // Adjusted path
import { 
  LayoutDashboard, Users, FileText, Settings, Search, Filter, 
  Upload, Download, Menu, X, Briefcase, RefreshCw, UserCheck, Calendar,
  List, Monitor, Users as UsersIcon, BookOpen, Award, CheckSquare, Square,
  Book, PenTool, Medal, Tag, XCircle, ChevronRight, Moon, Sun, Printer, LogOut,
  ShieldCheck // Imported for Admin Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// --- Constants & Color Palettes ---
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
const MONTHS_ORDER = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// URLs
const API_URL = '/api/people';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Get User Role
  const userRole = localStorage.getItem('role');
  
  // --- Dark Mode State ---
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // State for Modal & Drill-down
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [clickedTopic, setClickedTopic] = useState(null); 

  // --- Filter States ---
  const [filters, setFilters] = useState({
    searchName: '',
    selectedGroups: [],
    selectedPositions: [],
    selectedStartMonths: [],
    selectedDevTypes: [],
    selectedTopics: []
  });

  // --- Print hook ---
  const componentRef = React.useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: selectedPerson ? `IDP_Plan_${selectedPerson.name}` : 'IDP_Plan',
  });

  // --- Helper: Parse CSV Text (Keep for reference or fallback if API fails completely to JSON) ---
  const parseCSV = (text) => {
    // ... (Your existing CSV logic if needed, but we use JSON now)
    return []; 
  };

  // --- Fetch Data from API Proxy ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Check Auth Token
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role'); // Refresh role from storage just in case
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401 || response.status === 403) {
         localStorage.removeItem('token');
         localStorage.removeItem('role');
         navigate('/login');
         return;
      }

      if (!response.ok) throw new Error('Network response was not ok');
      
      const jsonData = await response.json();
      const processedData = jsonData.map((item, index) => ({
        ...item,
        id: index, 
      }));

      setData(processedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
      // alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, []);

  // --- Logout Function ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

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
      const current = prev[field];
      const next = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  // --- Export Report Logic (Excel) ---
  const handleExportExcel = () => {
    try {
      const exportData = filteredData.map((item, idx) => ({
        'ลำดับ': idx + 1,
        'ปีงบประมาณ': item.year,
        'หน่วยงาน': item.department,
        'กลุ่มงาน': item.group,
        'ชื่อ-สกุล': item.name,
        'ตำแหน่ง': item.position,
        'ผู้ประเมิน': item.evaluator,
        'ประเภทการพัฒนา': item.devType,
        'หัวข้อการพัฒนา': item.topic,
        'เป้าหมาย (Target)': item.target,
        'ผลลัพธ์ (Actual)': item.actual,
        'ช่องว่าง (Gap)': item.gap,
        '70% (การปฏิบัติ)': item.method70,
        '20% (พี่เลี้ยง)': item.method20,
        '10% (การอบรม)': item.method10,
        'เดือนเริ่มต้น': item.startMonth,
        'เดือนสิ้นสุด': item.endMonth,
        'งบประมาณ': item.budget,
        'ตัวชี้วัด (KPI)': item.kpi
      }));

      const wscols = [
        { wch: 6 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 30 },
        { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
      ];

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = wscols;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "IDP_Report");
      const currentDate = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `IDP_Report_${currentDate}.xlsx`);
    } catch (error) {
      console.error("Export Error:", error);
      alert("เกิดข้อผิดพลาดในการ Export ไฟล์ กรุณาลองใหม่");
    }
  };

  // --- Reusable Checkbox Component ---
  const FilterCheckboxList = ({ title, field, options, maxHeight = "max-h-32" }) => (
    <div className="space-y-1">
       <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</label>
       <div className={`bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-2 ${maxHeight} overflow-y-auto custom-scrollbar dark:custom-scrollbar-dark`}>
          {options.map((opt, idx) => {
             const isChecked = filters[field].includes(opt);
             return (
                <div key={idx} 
                     className={`flex items-start p-1.5 rounded cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50 dark:bg-indigo-900/40' : 'hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                     onClick={() => toggleCheckbox(field, opt)}
                >
                   <div className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center mr-2 transition-all ${isChecked ? 'bg-indigo-500 border-indigo-500' : 'bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500'}`}>
                      {isChecked && <CheckSquare size={12} className="text-white" />}
                   </div>
                   <span className="text-sm text-slate-700 dark:text-slate-200 leading-snug break-words">{opt}</span>
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
          year: item.year,
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

  // --- Render Course Card Helper ---
  const renderCourseCard = (course, idx, colorClass, numberPrefix) => (
    <div key={idx} className="bg-white dark:bg-slate-700/50 p-5 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden mb-4">
        <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`}></div>
        <div className="flex flex-col md:flex-row justify-between mb-4 pl-3">
            <div className="flex-1 pr-4">
                <div className="flex items-center mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    {course.devType}
                    </span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">
                    <span className="text-slate-500 dark:text-slate-400 mr-2">{numberPrefix}</span>
                    {course.topic}
                </h4>
            </div>
            <div className="mt-4 md:mt-0 flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 text-right">
                <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-600 border border-slate-100 dark:border-slate-500 px-3 py-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 dark:text-slate-300 font-semibold uppercase">Gap</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-white">{course.gap}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="pt-4 border-t border-slate-100 dark:border-slate-600 pl-3">
            <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">รูปแบบการพัฒนา (70:20:10 Model)</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center mb-1 text-blue-700 dark:text-blue-300">
                        <Monitor size={14} className="mr-1.5" />
                        <span className="text-xs font-bold">70% การปฏิบัติ</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 pl-5">{course.method70 || '-'}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-100 dark:border-orange-800">
                    <div className="flex items-center mb-1 text-orange-700 dark:text-orange-300">
                        <UsersIcon size={14} className="mr-1.5" />
                        <span className="text-xs font-bold">20% พี่เลี้ยง</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 pl-5">{course.method20 || '-'}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center mb-1 text-emerald-700 dark:text-emerald-300">
                        <BookOpen size={14} className="mr-1.5" />
                        <span className="text-xs font-bold">10% การอบรม</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 pl-5">{course.method10 || '-'}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 mt-4 border-t border-slate-100 dark:border-slate-600 pl-3">
            <div>
                <span className="text-slate-400 font-semibold block mb-1 flex items-center"><Calendar size={12} className="mr-1"/> ช่วงเวลาดำเนินการ (Timeline)</span>
                <p className="text-slate-700 dark:text-slate-200 font-medium">{course.startMonth} - {course.endMonth}</p>
            </div>
            <div>
                <span className="text-slate-400 font-semibold block mb-1">ตัวชี้วัดความสำเร็จ (KPI)</span>
                <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">{course.kpi || '-'}</p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 overflow-hidden relative transition-colors duration-200">
      
      {/* --- Sidebar --- */}
      <aside 
        className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white dark:bg-slate-800 shadow-2xl transition-all duration-300 flex flex-col z-20 overflow-hidden border-r border-slate-100 dark:border-slate-700 relative`}
      >
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-900 dark:to-violet-900 text-white flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-wide">ข้อมูลฝึกอบรมบุคลากร</h1>
            <p className="text-xs text-indigo-100 opacity-80">กองยุทธศาสตร์และแผนงาน</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar dark:custom-scrollbar-dark">
          
          {/* Navigation */}
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              <LayoutDashboard size={20} className="mr-3" /> ภาพรวม (Overview)
            </button>
            {/* All List - Only visible to Admin */}
            {userRole === 'admin' && (
              <button 
                onClick={() => setActiveTab('list')}
                className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
              >
                <Users size={20} className="mr-3" /> รายชื่อรวม (All List)
              </button>
            )}
            
            {/* Admin Menu - Only visible to Admin 
            {userRole === 'admin' && (
              <>
                <button 
                  onClick={() => navigate('/employees')}
                  className="w-full flex items-center p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all font-medium"
                >
                  <Briefcase size={20} className="mr-3" /> รายชื่อบุคลากร (Personnel List)
                </button>
                <button 
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all font-medium"
                >
                  <ShieldCheck size={20} className="mr-3" /> จัดการผู้ใช้งาน (Admin)
                </button>
              </>
            )}
            */}
          </nav>


          <hr className="border-slate-100 dark:border-slate-700" />

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center text-slate-800 font-semibold mb-2">
              <Filter size={18} className="mr-2 text-indigo-500" /> ตัวกรองข้อมูล
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="ค้นหาชื่อบุคลากร..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                value={filters.searchName}
                onChange={(e) => setFilters({...filters, searchName: e.target.value})}
              />
            </div>

            <FilterCheckboxList title="กลุ่มงาน" field="selectedGroups" options={uniqueGroups} />
            <FilterCheckboxList title="ตำแหน่ง" field="selectedPositions" options={uniquePositions} />
            <FilterCheckboxList title="เดือนเริ่มต้น" field="selectedStartMonths" options={uniqueStartMonths} />
            <FilterCheckboxList title="ประเภทการพัฒนา" field="selectedDevTypes" options={uniqueDevTypes} />
            <FilterCheckboxList title="หัวข้อการพัฒนา" field="selectedTopics" options={uniqueTopics} maxHeight="max-h-96" />
          </div>

          <hr className="border-slate-100" />
          
          {/* Logout Button Temporarily Disabled 
          <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all font-semibold mt-4">
             <LogOut size={20} className="mr-3"/> ออกจากระบบ (Logout)
          </button>
          */}
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-10 transition-colors duration-200">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="mr-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                <Menu size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {activeTab === 'dashboard' ? 'ภาพรวมการพัฒนา (Overview)' : 'รายการข้อมูล (Data List)'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden md:flex flex-col text-right mr-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">System Data</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end">
                   {lastUpdated ? `อัปเดต: ${lastUpdated.toLocaleTimeString('th-TH')}` : 'กำลังเชื่อมต่อ...'}
                </p>
             </div>
             
             <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                title="สลับโหมดสี (Light/Dark)"
             >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
             </button>

             <button 
               onClick={fetchData} 
               disabled={loading}
               className={`p-2 rounded-full ${loading ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-300 animate-spin' : 'bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800'} transition-all`}
               title="รีเฟรชข้อมูล"
             >
                <RefreshCw size={20} />
             </button>
             
             <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold border-2 border-white dark:border-slate-700 shadow-md">
                AD
             </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900 scroll-smooth transition-colors duration-200">
          
          {loading ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <RefreshCw size={48} className="animate-spin mb-4 text-indigo-400" />
                <p className="text-lg font-medium text-slate-600">กำลังดึงข้อมูล...</p>
                <p className="text-sm">กรุณารอสักครู่</p>
             </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6 max-w-7xl mx-auto pb-10">
                  
                  {/* Search Results Table on Dashboard */}
                  {filters.searchName && (
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6 animate-fade-in">
                       <div className="flex justify-between items-center mb-6">
                         <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
                            <Search className="mr-2" size={20}/>
                            ผลการค้นหาบุคลากร (Search Results)
                         </h3>
                       </div>
                       <div className="overflow-x-auto">
                         <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                             <tr>
                               <th className="px-6 py-4 w-16">#</th>
                               <th className="px-6 py-4">ชื่อ-สกุล</th>
                               <th className="px-6 py-4">ตำแหน่ง</th>
                               <th className="px-6 py-4">กลุ่มงาน</th>
                               <th className="px-6 py-4 text-center">แผนพัฒนา</th>
                               <th className="px-6 py-4 text-center">รายละเอียด</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                             {displayedPeopleList.map((person, idx) => (
                               <tr key={idx} onClick={() => setSelectedPerson(person)} className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors group">
                                 <td className="px-6 py-4 text-slate-400 dark:text-slate-500">{idx + 1}</td>
                                 <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600">{person.name}</td>
                                 <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{person.position}</td>
                                 <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{person.group}</td>
                                 <td className="px-6 py-4 text-center"><span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-full text-xs font-bold">{person.courses.length}</span></td>
                                 <td className="px-6 py-4 text-center"><ChevronRight size={18} className="mx-auto text-slate-300 group-hover:text-indigo-500" /></td>
                               </tr>
                             ))}
                             {displayedPeopleList.length === 0 && (
                               <tr>
                                 <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                   ไม่พบรายชื่อที่ค้นหา
                                 </td>
                               </tr>
                             )}
                           </tbody>
                         </table>
                       </div>
                     </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: 'บุคลากรทั้งหมด', value: stats.totalPeople, unit: 'คน', icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
                      { title: 'รวมความรู้ (Knowledge)', value: stats.totalKnowledge, unit: 'รายการ', icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
                      { title: 'รวมทักษะ (Skills)', value: stats.totalSkills, unit: 'รายการ', icon: Settings, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/30' },
                      { title: 'สมรรถนะ (Competency)', value: stats.totalCompetency, unit: 'รายการ', icon: Award, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.title}</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stat.value} <span className="text-xs font-normal text-slate-400">{stat.unit}</span></h3>
                          </div>
                          <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                        สัดส่วนประเภทการพัฒนา
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={devTypeData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: theme === 'dark' ? '#cbd5e1' : '#64748b'}} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#f1f5f9' : '#1e293b'}} />
                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30} label={{ position: 'right', fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}>
                              {devTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                        <span className="w-1 h-6 bg-pink-500 rounded-full mr-3"></span>
                        วิเคราะห์ช่องว่างสมรรถนะ
                      </h3>
                      <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={gapData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                              {gapData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#ef4444'} stroke={theme === 'dark' ? '#1e293b' : '#fff'} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#f1f5f9' : '#1e293b'}} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                        <span className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></span>
                        ไทม์ไลน์การเริ่มต้นพัฒนา
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthActivityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                            <XAxis dataKey="name" tick={{fontSize: 12, fill: theme === 'dark' ? '#cbd5e1' : '#64748b'}} />
                            <YAxis allowDecimals={false} tick={{fill: theme === 'dark' ? '#cbd5e1' : '#64748b'}} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#f1f5f9' : '#1e293b'}} />
                            <Line type="monotone" dataKey="จำนวน" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Topics List */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mt-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                            <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                            สรุปหัวข้อการพัฒนาตามประเภท (คลิกเพื่อกรองรายชื่อ)
                        </h3>
                        {clickedTopic && (
                           <button onClick={() => setClickedTopic(null)} className="text-sm flex items-center text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/30 dark:hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors border border-transparent dark:border-red-900">
                             <XCircle size={16} className="mr-1"/> ล้างตัวกรอง ({clickedTopic})
                           </button>
                        )}
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.keys(topicStats).sort().map((type, idx) => (
                           <div key={idx} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                              <h4 className="font-bold text-indigo-700 dark:text-indigo-400 mb-3 text-md border-b border-indigo-100 dark:border-slate-600 pb-2 flex items-center">
                                 <Tag size={16} className="mr-2"/>
                                 {type} <span className="ml-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full">{Object.keys(topicStats[type]).length} หัวข้อ</span>
                              </h4>
                              <ul className="space-y-2">
                                 {Object.keys(topicStats[type]).sort().map((topic, i) => {
                                    const count = topicStats[type][topic].size;
                                    const isActive = clickedTopic === topic;
                                    return (
                                      <li 
                                        key={i} 
                                        onClick={() => setClickedTopic(isActive ? null : topic)}
                                        className={`text-sm flex items-start cursor-pointer transition-all p-2 rounded-lg ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                      >
                                         <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 mr-2 flex-shrink-0 ${isActive ? 'bg-white' : 'bg-indigo-400'}`}></span>
                                         <span className="leading-snug flex-1">
                                            {topic} 
                                            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-indigo-600' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                                               {count} 
                                            </span>
                                         </span>
                                      </li>
                                    );
                                 })}
                              </ul>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'list' && (
                 <div className="max-w-7xl mx-auto pb-10">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">รายชื่อบุคลากร (Personnel List)</h3>
                        <button onClick={handleExportExcel} className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm hover:shadow-md">
                           <Download size={16} className="mr-2" /> Export Excel
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                            <tr>
                              <th className="px-6 py-4 w-16">#</th>
                              <th className="px-6 py-4">ชื่อ-สกุล</th>
                              <th className="px-6 py-4">ตำแหน่ง</th>
                              <th className="px-6 py-4">กลุ่มงาน</th>
                              <th className="px-6 py-4 text-center">แผนพัฒนา</th>
                              <th className="px-6 py-4 text-center">รายละเอียด</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {displayedPeopleList.map((person, idx) => (
                              <tr key={idx} onClick={() => setSelectedPerson(person)} className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors group">
                                <td className="px-6 py-4 text-slate-400 dark:text-slate-500">{idx + 1}</td>
                                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600">{person.name}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{person.position}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{person.group}</td>
                                <td className="px-6 py-4 text-center"><span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-full text-xs font-bold">{person.courses.length}</span></td>
                                <td className="px-6 py-4 text-center"><ChevronRight size={18} className="mx-auto text-slate-300 group-hover:text-indigo-500" /></td>
                              </tr>
                            ))}
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

      {/* --- Modal Overlay --- */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedPerson(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-slide-up border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-900 dark:to-violet-900 text-white flex justify-between items-start shrink-0">
               <div>
                  <h2 className="text-2xl font-bold">{selectedPerson.name}</h2>
                  <p className="text-indigo-100 mt-1 opacity-90">{selectedPerson.position} | {selectedPerson.group}</p>
               </div>
               <button onClick={() => setSelectedPerson(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                  <X size={24} />
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center">
                     <Book className="mr-2 text-indigo-500"/> รายการแผนพัฒนา ({selectedPerson.courses.length})
                  </h3>
                   <button 
                      onClick={handlePrint}
                      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                   >
                     <Printer size={16} /> <span>พิมพ์แบบฟอร์ม (PDF)</span>
                   </button>
               </div>

               <div className="space-y-4">
                  {selectedPerson.courses.map((course, idx) => 
                     renderCourseCard(course, idx, `bg-${COLORS[idx % COLORS.length]}`, `${idx + 1}.`)
                  )}
               </div>
            </div>

            {/* Hidden Print Component */}
            <div className="hidden">
               <IDPPrintForm ref={componentRef} person={selectedPerson} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
