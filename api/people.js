export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { GOOGLE_GAS_API_URL, GOOGLE_GAS_API_KEY } = process.env;

  if (!GOOGLE_GAS_API_URL) {
    return res.status(500).json({ error: 'Missing GOOGLE_GAS_API_URL in Environment Variables' });
  }

  try {
    const fetchUrl = `${GOOGLE_GAS_API_URL}?key=${GOOGLE_GAS_API_KEY || ''}`;
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      throw new Error(`GAS API fetch failed: ${response.statusText}`);
    }

    const jsonData = await response.json();
    
    // Map GAS results to Dashboard format (Same mapping as index.js)
    const results = jsonData.map(item => ({
        year: item['ปีงบประมาณ'],
        department: item['หน่วยงาน'],
        group: item['กลุ่มงาน'],
        name: item['ชื่อ-สกุล'],
        position: item['ตำแหน่ง'],
        evaluator: item['ผู้ประเมิน'],
        devType: item['ประเภทการพัฒนา'],
        topic: item['หัวข้อการพัฒนา'],
        target: item['ระดับคาดหวัง(Target)'],
        actual: item['ผลประเมิน(Actual)'],
        gap: item['ค่าGap'],
        method70: item['วิธีการ_70(ปฏิบัติ)'],
        method20: item['วิธีการ_20(พี่เลี้ยง)'],
        method10: item['วิธีการ_10(อบรม)'],
        startMonth: item['เดือนเริ่มต้น'],
        endMonth: item['เดือนสิ้นสุด'],
        budget: item['งบประมาณ'],
        kpi: item['ตัวชี้วัด(KPI)']
    }));

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching data from GAS:', error);
    res.status(500).json({ error: 'Failed to fetch data from GAS API: ' + error.message });
  }
}
