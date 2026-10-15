const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZmE1Yzg4YS02NTk5LTQ2OTktOTY5MC0yMjc3NGY2MDlmMmQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMzcwY2QwMWEtZjBiYS00YTlmLTljM2EtMDAzMjAyNGUxZDAzIiwiaWF0IjoxNzkxMjUzMzgxfQ.Ec9MgnSkAHv4v0Mi5butHCNJfb4FOhPI5zQ0nWcu4CE';
const baseUrl = 'https://n8n.grupokaldiris.com.br/api/v1';
const workflowId = 'GIwxf2EyvbdEK0MB';

async function checkExecutions() {
  const res = await fetch(`${baseUrl}/executions?workflowId=${workflowId}&limit=10`, {
    headers: { 'X-N8N-API-KEY': apiKey, 'Accept': 'application/json' }
  });

  const data = await res.json();
  for (const ex of (data.data || [])) {
    try {
      const detailRes = await fetch(`${baseUrl}/executions/${ex.id}?includeData=true`, {
        headers: { 'X-N8N-API-KEY': apiKey, 'Accept': 'application/json' }
      });
      const d = await detailRes.json();
      console.log(`- ID: ${ex.id} | Status: ${ex.status} | LastNode: ${d.data?.resultData?.lastNodeExecuted} | Error: ${d.data?.resultData?.error?.message || 'none'}`);
    } catch (e) {
      console.log(`- ID: ${ex.id} | Status: ${ex.status} | Could not fetch detail`);
    }
  }
}

checkExecutions().catch(console.error);
