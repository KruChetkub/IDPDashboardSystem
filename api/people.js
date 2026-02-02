export default async function handler(req, res) {
  // Allow CORS for local development and specific domains if needed
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

  const { GOOGLE_SHEET_CSV_URL } = process.env;

  if (!GOOGLE_SHEET_CSV_URL) {
    return res.status(500).json({ error: 'Server configuration error: Missing Sheet URL' });
  }

  try {
    // Add cache busting to ensure fresh data from Google Sheets
    const timestamp = new Date().getTime();
    const fetchUrl = `${GOOGLE_SHEET_CSV_URL}&t=${timestamp}`;

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const data = await response.text();
    res.status(200).send(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data from source' });
  }
}
