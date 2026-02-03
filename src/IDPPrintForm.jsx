import React from 'react';

export const IDPPrintForm = React.forwardRef(({ person }, ref) => {
  if (!person) return null;

  // Helper to format date
  const currentDate = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div ref={ref} className="print-container font-sarabun text-black bg-white p-8 w-[210mm] min-h-[297mm] mx-auto relative text-[16px] leading-relaxed">
      
      {/* --- Styles for Print Only --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
        
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
          .print-container {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            margin: 0;
            padding: 20mm;
            page-break-after: always;
          }
        }
        
        .font-sarabun {
          font-family: 'Sarabun', sans-serif;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }
        
        th, td {
          border: 1px solid #000;
          padding: 8px;
          vertical-align: top;
        }
        
        th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }

        .no-border td {
            border: none;
            padding: 4px 0;
        }
      `}</style>

      {/* --- Header (Garuda Placeholder) --- */}
      <div className="text-center mb-8">
         <div className="w-[3cm] h-[3cm] mx-auto mb-4 flex items-center justify-center">
            <img src="/logo.png" alt="ตราครุฑ" className="w-full h-full object-contain" />
         </div>
         <h1 className="text-xl font-bold">แผนพัฒนาบุคลากรรายบุคคล (Individual Development Plan : IDP)</h1>
         <h2 className="text-lg font-bold">ประจำปีงบประมาณ {person.year || '2567'}</h2>
      </div>

      {/* --- Personal Info --- */}
      <div className="mb-6">
        <table className="no-border w-full text-[16px]">
            <tbody>
                <tr>
                    <td width="15%"><b>ชื่อ-สกุล:</b></td>
                    <td width="35%">{person.name}</td>
                    <td width="15%"><b>ตำแหน่ง:</b></td>
                    <td width="35%">{person.position}</td>
                </tr>
                <tr>
                    <td><b>สังกัด:</b></td>
                    <td>{person.department}</td>
                    <td><b>กลุ่มงาน:</b></td>
                    <td>{person.group}</td>
                </tr>
            </tbody>
        </table>
      </div>

      {/* --- IDP Table --- */}
      <div className="mb-6">
         <h3 className="font-bold mb-2 text-[16px]">รายละเอียดแผนพัฒนา</h3>
         <table className="text-[14px]">
             <thead>
                 <tr>
                     <th width="5%">ลำดับ</th>
                     <th width="25%">หัวข้อ/สมรรถนะที่พัฒนา</th>
                     <th width="40%">วิธีการพัฒนา (70:20:10)</th>
                     <th width="15%">ช่วงเวลา</th>
                     <th width="15%">งบประมาณ</th>
                 </tr>
             </thead>
             <tbody>
                 {person.courses.map((course, idx) => (
                     <tr key={idx}>
                         <td className="text-center">{idx + 1}</td>
                         <td>
                             <div className="font-bold">{course.topic}</div>
                             <div className="text-xs text-gray-600 mt-1">ประเภท: {course.devType}</div>
                             {course.target && <div className="text-xs mt-1">เป้าหมาย: {course.target}</div>}
                         </td>
                         <td>
                             {course.method70 && <div className="mb-1"><span className="font-bold">70%:</span> {course.method70}</div>}
                             {course.method20 && <div className="mb-1"><span className="font-bold">20%:</span> {course.method20}</div>}
                             {course.method10 && <div><span className="font-bold">10%:</span> {course.method10}</div>}
                         </td>
                         <td className="text-center">
                             {course.startMonth} - {course.endMonth}
                         </td>
                         <td className="text-right">
                             {course.budget ? `${Number(course.budget).toLocaleString()} บาท` : '-'}
                         </td>
                     </tr>
                 ))}
             </tbody>
         </table>
      </div>

      {/* --- KPI --- */}
      <div className="mb-8">
          <h3 className="font-bold mb-2 text-[16px]">ตัวชี้วัดความสำเร็จ (KPIs)</h3>
          <div className="border border-black p-4 min-h-[100px] text-[14px]">
              {person.courses.map(c => c.kpi).filter(Boolean).join(', ') || '-'}
          </div>
      </div>

      {/* --- Signatures --- */}
      <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-center">
              <div className="mb-8">ลงชื่อ ........................................................... ผู้จัดทำแผน</div>
              <div>( {person.name} )</div>
              <div className="mt-2">วันที่ {currentDate}</div>
          </div>
          <div className="text-center">
              <div className="mb-8">ลงชื่อ ........................................................... ผู้บังคับบัญชา</div>
              <div>( ........................................................... )</div>
              <div className="mt-2 text-transparent">วันที่ {currentDate}</div>
          </div>
      </div>

    </div>
  );
});

export default IDPPrintForm;
