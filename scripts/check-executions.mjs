const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZmE1Yzg4YS02NTk5LTQ2OTktOTY5MC0yMjc3NGY2MDlmMmQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMzcwY2QwMWEtZjBiYS00YTlmLTljM2EtMDAzMjAyNGUxZDAzIiwiaWF0IjoxNzkxMjUzMzgxfQ.Ec9MgnSkAHv4v0Mi5butHCNJfb4FOhPI5zQ0nWcu4CE';
const baseUrl = 'https://n8n.grupokaldiris.com.br/api/v1';
const workflowId = 'GIwxf2EyvbdEK0MB';

async function checkExecutions() {
  const res = await fetch(`${baseUrl}/executions?workflowId=${workflowId}&limit=5`, {
    headers: { 'X-N8N-API-KEY': apiKey, 'Accept': 'application/json' }
  });

  const data = await res.json();
  console.log('Execuções encontradas:', data.data?.length);
  for (const ex of (data.data || [])) {
    console.log(`- ID: ${ex.id} | Status: ${ex.status} | Mode: ${ex.mode} | Started: ${ex.startedAt}`);
  }

  if (data.data && data.data.length > 0) {
    const latestId = data.data[0].id;
    const detailRes = await fetch(`${baseUrl}/executions/${latestId}?includeData=true`, {
      headers: { 'X-N8N-API-KEY': apiKey, 'Accept': 'application/json' }
    });
    const detail = await detailRes.json();
    console.log(`\nDetalhes da Execução #${latestId}:`);
    console.log('Status:', detail.status);
    if (detail.data?.resultData?.error) {
      console.log('Erro:', JSON.stringify(detail.data.resultData.error, null, 2));
    }
  }
}

checkExecutions().catch(console.error);
