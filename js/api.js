function cfg() {
  if (!window.SV_CONFIG?.SUPABASE_URL || !window.SV_CONFIG?.SUPABASE_ANON_KEY) {
    throw new Error("Configure config.js com SUPABASE_URL e SUPABASE_ANON_KEY");
  }
  return window.SV_CONFIG;
}

function sbHeaders() {
  const { SUPABASE_ANON_KEY } = cfg();
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

async function sbGet(table, query = "") {
  const { SUPABASE_URL } = cfg();
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, { headers: sbHeaders() });
  if (!res.ok) throw new Error(`GET ${table}: ${res.status}`);
  return res.json();
}

async function sbPost(table, body, prefer = "return=representation") {
  const { SUPABASE_URL } = cfg();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...sbHeaders(), Prefer: prefer },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`POST ${table}: ${res.status} ${txt}`);
  }
  if (prefer.includes("minimal")) return null;
  return res.json();
}

async function loadCatalogOnline() {
  const [insumos, precos, equip] = await Promise.all([
    sbGet("dim_insumo", "select=id_insumo,nome,unidade,categoria&categoria=in.(LUBRIFICANTE,FILTRO)&order=categoria,nome"),
    sbGet("preco_insumo", "select=id_insumo,valor_unitario&ativo=eq.true"),
    sbGet("dim_equipamento_lubri", "select=frota,modelo,intervalo_horas&ativo=eq.true").catch(() => []),
  ]);

  const priceMap = {};
  for (const p of precos) {
    priceMap[p.id_insumo] = parseFloat(p.valor_unitario) || 0;
  }

  const catalog = insumos.map((i) => ({
    id_insumo: i.id_insumo,
    nome: i.nome,
    unidade: i.unidade,
    categoria: i.categoria,
    valor_unitario: priceMap[i.id_insumo] || 0,
  }));

  const frotas = equip.map((e) => ({
    frota: String(e.frota),
    modelo: e.modelo || "",
    intervalo_horas: parseFloat(e.intervalo_horas) || 300,
  }));

  await Storage.saveCatalog("insumos", catalog);
  await Storage.saveCatalog("frotas", frotas);
  return { catalog, frotas };
}

async function getCatalog() {
  let insumos = await Storage.getCatalog("insumos");
  let frotas = await Storage.getCatalog("frotas");
  const hasCache = insumos?.length > 0;

  if (navigator.onLine) {
    try {
      const fresh = await loadCatalogOnline();
      return fresh;
    } catch (e) {
      if (hasCache) return { catalog: insumos, frotas: frotas || [] };
      throw e;
    }
  }

  if (hasCache) return { catalog: insumos, frotas: frotas || [] };
  return { catalog: [], frotas: [] };
}

function genOrderNumber() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LUB3-${stamp}-${rnd}`;
}

async function syncOne(record) {
  const existing = await sbGet(
    "lubrificacao_v3",
    `client_id=eq.${record.client_id}&select=client_id`
  );
  if (existing.length) return;

  const header = {
    client_id: record.client_id,
    order_number: record.order_number,
    vehicle: record.vehicle,
    operator: record.operator,
    tipo_servico: record.tipo_servico,
    hourmeter_atual: record.hourmeter_atual,
    hourmeter_prox: record.hourmeter_prox,
    data_servico: record.data_servico,
    localizacao: "CAMPO",
    observation: record.observation || null,
    itens: record.itens,
    custo_total: record.custo_total,
  };

  await sbPost("lubrificacao_v3", header);

  for (const item of record.itens) {
    if (!item.quantidade || item.quantidade <= 0) continue;
    if (!item.id_insumo || item.pendente_cadastro) continue;
    await sbPost("financeiro_lubrificacao", {
      order_number: record.order_number,
      id_frota: record.vehicle,
      localizacao: "Lubrificação",
      id_insumo: item.id_insumo,
      insumo_nome: item.nome,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      custo_total: item.custo_total,
      observacao: record.observation || null,
      criado_em: record.data_servico,
    });
  }

  try {
    if (record.tipo_servico === "preventiva" && record.hourmeter_atual != null) {
      await sbPost(
        "ultima_troca_lubri",
        {
          frota: record.vehicle,
          horimetro_ultima_troca: record.hourmeter_atual,
          data_ultima_troca: record.data_servico.split("T")[0],
        },
        "return=minimal,resolution=merge-duplicates"
      );
    }
  } catch (e) {
    console.warn("ultima_troca_lubri:", e);
  }
}

async function syncPending() {
  if (!navigator.onLine) return { synced: 0, failed: 0 };
  const pending = await Storage.getPendingAll();
  let synced = 0;
  let failed = 0;

  for (const rec of pending) {
    try {
      await syncOne(rec);
      await Storage.removePending(rec.client_id);
      const updated = { ...rec, sync_status: "synced" };
      await Storage.saveRecent(updated);
      synced++;
    } catch (e) {
      console.error("Sync fail", rec.client_id, e);
      failed++;
    }
  }
  return { synced, failed };
}

window.Api = { getCatalog, loadCatalogOnline, syncPending, genOrderNumber };
