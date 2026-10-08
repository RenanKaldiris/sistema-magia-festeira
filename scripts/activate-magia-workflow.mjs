const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZmE1Yzg4YS02NTk5LTQ2OTktOTY5MC0yMjc3NGY2MDlmMmQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMzcwY2QwMWEtZjBiYS00YTlmLTljM2EtMDAzMjAyNGUxZDAzIiwiaWF0IjoxNzkxMjUzMzgxfQ.Ec9MgnSkAHv4v0Mi5butHCNJfb4FOhPI5zQ0nWcu4CE';
const baseUrl = 'https://n8n.grupokaldiris.com.br/api/v1';
const workflowId = 'GIwxf2EyvbdEK0MB';

async function activate() {
  console.log(`Ativando workflow ${workflowId}...`);
  const res = await fetch(`${baseUrl}/workflows/${workflowId}/activate`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Accept': 'application/json'
    }
  });

  if (res.ok) {
    const data = await res.json();
    console.log('✅ Workflow ativado com sucesso! Active:', data.active);
  } else {
    console.log('Tentando via PATCH /workflows/{id}...');
    const patchRes = await fetch(`${baseUrl}/workflows/${workflowId}`, {
      method: 'PATCH',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ active: true })
    });
    const patchData = await patchRes.json();
    console.log('Resultado PATCH:', patchData.active ? '✅ Ativado!' : patchData);
  }
}

activate().catch(console.error);
