const CONFIG = {
  url: 'https://wdghlbswlvwlmkywiibr.supabase.co',
  publishableKey: 'sb_publishable_J4Cc9bBwxTtmqf9qSxle-g_K_r1vdFT'
};

const TABLES = [
  'courses',
  'lecture_applications',
  'corporate_inquiries',
  'instructor_applications'
];

async function checkTable(table) {
  const url = new URL(`/rest/v1/${table}`, CONFIG.url);
  url.searchParams.set('select', 'id');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: {
      apikey: CONFIG.publishableKey,
      Authorization: `Bearer ${CONFIG.publishableKey}`,
      Accept: 'application/json',
      'Accept-Profile': 'public'
    }
  });

  const text = await response.text();
  return {
    table,
    status: response.status,
    ok: response.ok,
    body: text
  };
}

const results = await Promise.all(TABLES.map(checkTable));
for (const result of results) {
  console.log(`\n[${result.table}] ${result.status} ${result.ok ? 'OK' : 'ERROR'}`);
  console.log(result.body);
}
