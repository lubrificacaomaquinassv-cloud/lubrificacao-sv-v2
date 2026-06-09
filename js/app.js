const MAX_LINES = 5;
let tipoServico = "preventiva";
let catalog = [];
let frotas = [];
let oleoLines = [];
let filtroLines = [];

const $ = (id) => document.getElementById(id);

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function fmtR(v) {
  return `R$ ${(v || 0).toFixed(2).replace(".", ",")}`;
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function toast(msg, isError = false) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.toggle("error", isError);
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3500);
}

function setOnlineUI() {
  const banner = $("offlineBanner");
  if (banner) banner.classList.toggle("hidden", navigator.onLine);
}

async function updatePendingBadge() {
  /* operação silenciosa — fila offline sem texto técnico na tela */
}

function filterInsumos(q, categoria) {
  const t = (q || "").trim().toUpperCase();
  return catalog
    .filter((i) => i.categoria === categoria)
    .filter((i) => !t || i.nome.toUpperCase().includes(t) || i.id_insumo.toUpperCase().includes(t))
    .slice(0, 8);
}

function filterFrotas(q) {
  const t = (q || "").trim().toUpperCase();
  return frotas
    .filter((f) => !t || f.frota.toUpperCase().includes(t) || (f.modelo || "").toUpperCase().includes(t))
    .slice(0, 8);
}

function setupAutocomplete(inputId, listId, getOptions, onPick) {
  const input = $(inputId);
  const list = $(listId);

  function render() {
    const opts = getOptions(input.value);
    list.innerHTML = "";
    if (!opts.length) {
      list.classList.remove("open");
      return;
    }
    opts.forEach((o) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = typeof o === "string" ? o : o.label || o.frota;
      btn.addEventListener("click", () => {
        onPick(o, input);
        list.classList.remove("open");
      });
      list.appendChild(btn);
    });
    list.classList.add("open");
  }

  input.addEventListener("input", render);
  input.addEventListener("focus", render);
  input.addEventListener("blur", () => setTimeout(() => list.classList.remove("open"), 200));
}

function createItemLine(container, categoria, lines, index) {
  const block = document.createElement("div");
  block.className = "item-block";
  block.dataset.index = index;

  const head = document.createElement("div");
  head.className = "item-head";
  head.innerHTML = `<span>${categoria === "LUBRIFICANTE" ? "Óleo" : "Filtro"} ${index + 1}</span>`;
  const btnRm = document.createElement("button");
  btnRm.type = "button";
  btnRm.className = "btn-clear-line";
  btnRm.textContent = "Remover";
  btnRm.addEventListener("click", () => removeLine(categoria, index));
  head.appendChild(btnRm);
  block.appendChild(head);

  const wrap = document.createElement("div");
  wrap.className = "autocomplete-wrap";
  const inp = document.createElement("input");
  inp.type = "text";
  inp.placeholder = "Nome do produto";
  inp.value = lines[index]?.nome || "";
  inp.dataset.role = "nome";
  const list = document.createElement("div");
  list.className = "autocomplete-list";
  wrap.appendChild(inp);
  wrap.appendChild(list);
  block.appendChild(wrap);

  const qtyField = document.createElement("div");
  qtyField.className = "field";
  qtyField.style.marginTop = "8px";
  qtyField.innerHTML = `<label>Quantidade</label>`;
  const qty = document.createElement("input");
  qty.type = "number";
  qty.min = "0";
  qty.step = categoria === "LUBRIFICANTE" ? "0.1" : "1";
  qty.inputMode = "decimal";
  qty.value = lines[index]?.quantidade || "";
  qty.dataset.role = "qty";
  qtyField.appendChild(qty);
  block.appendChild(qtyField);

  const hint = document.createElement("div");
  hint.className = "price-hint";
  hint.dataset.role = "hint";
  block.appendChild(hint);

  function pickItem(item) {
    lines[index] = {
      categoria,
      id_insumo: item.id_insumo,
      nome: item.nome,
      unidade: item.unidade,
      valor_unitario: item.valor_unitario,
      quantidade: parseFloat(qty.value) || 0,
      custo_total: 0,
      pendente_cadastro: false,
    };
    inp.value = item.nome;
    qtyField.querySelector("label").textContent = `Quantidade (${item.unidade})`;
    syncLineCost(lines[index]);
    updateLineHint(block, lines[index]);
    updateTotal();
  }

  function syncLineCost(line) {
    if (!line) return;
    line.quantidade = parseFloat(qty.value) || 0;
    if (line.id_insumo) {
      line.custo_total = line.quantidade * line.valor_unitario;
      line.pendente_cadastro = false;
    } else {
      line.custo_total = 0;
      line.pendente_cadastro = true;
    }
  }

  inp.addEventListener("input", () => {
    const typed = inp.value.trim();
    if (lines[index]?.id_insumo && lines[index].nome !== typed) {
      lines[index] = { categoria, nome: typed, pendente_cadastro: true };
    } else if (!lines[index]) {
      lines[index] = { categoria, nome: typed, pendente_cadastro: true };
    } else {
      lines[index].nome = typed;
      lines[index].id_insumo = null;
      lines[index].pendente_cadastro = true;
    }

    if (catalog.length) {
      const opts = filterInsumos(typed, categoria);
      list.innerHTML = "";
      opts.forEach((item) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = item.nome;
        b.addEventListener("mousedown", (e) => e.preventDefault());
        b.addEventListener("click", () => {
          pickItem(item);
          list.classList.remove("open");
        });
        list.appendChild(b);
      });
      list.classList.toggle("open", opts.length > 0 && typed.length > 0);
    } else {
      list.classList.remove("open");
    }
    updateLineHint(block, lines[index]);
    updateTotal();
  });

  qty.addEventListener("input", () => {
    if (!lines[index]) {
      lines[index] = { categoria, nome: inp.value.trim(), pendente_cadastro: true };
    }
    syncLineCost(lines[index]);
    updateLineHint(block, lines[index]);
    updateTotal();
  });

  inp.addEventListener("blur", () => {
    setTimeout(() => list.classList.remove("open"), 200);
    const typed = inp.value.trim();
    if (!typed) return;
    const match = catalog.find(
      (i) => i.categoria === categoria && i.nome.toUpperCase() === typed.toUpperCase()
    );
    if (match && !lines[index]?.id_insumo) pickItem(match);
  });

  if (lines[index]?.id_insumo) updateLineHint(block, lines[index]);
  else if (lines[index]?.nome) updateLineHint(block, lines[index]);

  container.appendChild(block);
}

function updateLineHint() {
  /* sem mensagens técnicas na linha do produto */
}

function collectItens() {
  const out = [];
  function scan(container, categoria, lines) {
    container.querySelectorAll(".item-block").forEach((block) => {
      const idx = parseInt(block.dataset.index, 10);
      const nome = block.querySelector('[data-role="nome"]')?.value?.trim();
      const qty = parseFloat(block.querySelector('[data-role="qty"]')?.value) || 0;
      if (!nome || qty <= 0) return;

      const stored = lines[idx];
      if (stored?.id_insumo && !stored.pendente_cadastro && stored.nome === nome) {
        out.push({ ...stored, quantidade: qty, custo_total: qty * stored.valor_unitario });
        return;
      }

      const match = catalog.find(
        (i) => i.categoria === categoria && i.nome.toUpperCase() === nome.toUpperCase()
      );
      if (match) {
        out.push({
          categoria,
          id_insumo: match.id_insumo,
          nome: match.nome,
          unidade: match.unidade,
          valor_unitario: match.valor_unitario,
          quantidade: qty,
          custo_total: qty * match.valor_unitario,
          pendente_cadastro: false,
        });
        return;
      }

      out.push({
        categoria,
        id_insumo: null,
        nome,
        unidade: categoria === "LUBRIFICANTE" ? "LITRO" : "UN",
        valor_unitario: 0,
        quantidade: qty,
        custo_total: 0,
        pendente_cadastro: true,
      });
    });
  }
  scan($("oleoContainer"), "LUBRIFICANTE", oleoLines);
  scan($("filtroContainer"), "FILTRO", filtroLines);
  return out;
}

function updateTotal() {
  /* custo calculado internamente no envio; não exibido ao operador */
}

function renderLines() {
  const oc = $("oleoContainer");
  const fc = $("filtroContainer");
  oc.innerHTML = "";
  fc.innerHTML = "";
  oleoLines.forEach((_, i) => createItemLine(oc, "LUBRIFICANTE", oleoLines, i));
  filtroLines.forEach((_, i) => createItemLine(fc, "FILTRO", filtroLines, i));
  $("btnAddOleo").disabled = oleoLines.length >= MAX_LINES;
  $("btnAddFiltro").disabled = filtroLines.length >= MAX_LINES;
}

function addLine(categoria) {
  const lines = categoria === "LUBRIFICANTE" ? oleoLines : filtroLines;
  if (lines.length >= MAX_LINES) return;
  lines.push(null);
  renderLines();
}

function removeLine(categoria, index) {
  const lines = categoria === "LUBRIFICANTE" ? oleoLines : filtroLines;
  lines.splice(index, 1);
  renderLines();
  updateTotal();
}

function suggestProximaTroca() {
  const frotaVal = $("frota").value.trim();
  const hAtual = parseFloat($("hAtual").value);
  if (!frotaVal || isNaN(hAtual)) return;
  const f = frotas.find((x) => x.frota === frotaVal);
  if (f?.intervalo_horas && !$("hProx").value) {
    $("hProx").value = Math.round(hAtual + f.intervalo_horas);
  }
}

function labelTipo(tipo) {
  if (tipo === "corretiva") return "Corretiva";
  return "Preventiva";
}

async function renderRecent() {
  const list = await Storage.getRecent();
  const el = $("recentList");
  if (!list.length) {
    el.innerHTML = '<p class="recent-empty">Nenhum serviço registrado ainda.</p>';
    return;
  }
  el.innerHTML = list
    .map(
      (r) => `
    <div class="recent-item">
      <div class="top">
        <span>Frota ${r.vehicle} · ${labelTipo(r.tipo_servico)}</span>
      </div>
      <div class="sub">${fmtDate(r.data_servico)} · ${r.operator || "—"}</div>
    </div>`
    )
    .join("");
}

async function trySync() {
  if (!navigator.onLine) return;
  try {
    await Api.loadCatalogOnline();
    await Api.syncPending();
  } catch (e) {
    console.warn(e);
  } finally {
    setOnlineUI();
    await updatePendingBadge();
    await renderRecent();
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const itens = collectItens();
  if (!itens.length) {
    toast("Informe ao menos 1 óleo ou filtro com quantidade", true);
    return;
  }

  const custo_total = itens.filter((i) => i.id_insumo && !i.pendente_cadastro)
    .reduce((s, i) => s + i.custo_total, 0);
  const dataStr = $("dataServico").value;
  const data_servico = dataStr
    ? new Date(dataStr + "T12:00:00").toISOString()
    : new Date().toISOString();

  const record = {
    client_id: uuid(),
    order_number: Api.genOrderNumber(),
    vehicle: $("frota").value.trim(),
    operator: $("operador").value.trim().toUpperCase(),
    tipo_servico: tipoServico,
    hourmeter_atual: parseFloat($("hAtual").value) || null,
    hourmeter_prox: parseFloat($("hProx").value) || null,
    data_servico,
    observation: $("obs").value.trim(),
    itens,
    custo_total,
    sync_status: "pending",
  };

  await Storage.addOperator(record.operator);
  await Storage.savePending(record);
  await Storage.saveRecent(record);

  if (navigator.onLine) {
    await trySync();
    toast("Serviço registrado!");
  } else {
    toast("Salvo no aparelho.");
  }

  oleoLines = [null];
  filtroLines = [];
  $("obs").value = "";
  $("hAtual").value = "";
  $("hProx").value = "";
  renderLines();
  updateTotal();
  await updatePendingBadge();
  await renderRecent();
}

async function init() {
  const today = new Date();
  $("dataServico").value = today.toISOString().slice(0, 10);
  setOnlineUI();

  document.querySelectorAll(".op-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".op-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      tipoServico = btn.dataset.op;
    });
  });

  $("btnAddOleo").addEventListener("click", () => addLine("LUBRIFICANTE"));
  $("btnAddFiltro").addEventListener("click", () => addLine("FILTRO"));
  $("formLub").addEventListener("submit", handleSubmit);

  $("hAtual").addEventListener("blur", suggestProximaTroca);
  $("frota").addEventListener("blur", suggestProximaTroca);

  window.addEventListener("online", trySync);
  window.addEventListener("offline", setOnlineUI);

  try {
    const data = await Api.getCatalog();
    catalog = data.catalog || [];
    frotas = data.frotas || [];
  } catch (err) {
    catalog = [];
    frotas = [];
    console.warn(err);
  }

  setupAutocomplete("frota", "frotaList", filterFrotas, (o, input) => {
    input.value = o.frota;
    suggestProximaTroca();
  });

  setupAutocomplete("operador", "operadorList", async (q) => {
    const hist = await Storage.getOperatorsHistory();
    const t = (q || "").trim().toUpperCase();
    return hist.filter((n) => !t || n.includes(t)).slice(0, 8).map((n) => ({ label: n, name: n }));
  }, (o, input) => {
    input.value = o.name;
  });

  oleoLines = [null];
  renderLines();
  setOnlineUI();
  await updatePendingBadge();
  await renderRecent();
  if (navigator.onLine) trySync();
}

init().catch((err) => {
  console.error(err);
  setOnlineUI();
});
