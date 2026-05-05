const https = require('https');

https.get('https://docs.google.com/spreadsheets/d/1ThKYJWthF5NOvbPcS-OYNniZhyJH8_v3uYygAPX8aW8/edit', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Look for sheet names in the HTML
    const regex = /"name":"([^"]+)","id":(\d+)/g;
    let match;
    const sheets = new Map();
    while ((match = regex.exec(data)) !== null) {
      sheets.set(match[1], match[2]);
    }
    console.log("Found Sheets:");
    for (const [name, id] of sheets.entries()) {
      console.log(`- ${name} (gid: ${id})`);
    }
  });
}).on('error', err => console.log('Error: ', err.message));
