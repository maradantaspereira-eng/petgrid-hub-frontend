const API_URL = "http://127.0.0.1:5001";

let listaProdutosGlobal = [];
let listaCategoriasGlobal = [];
let modoVisualizacao = "cards";

// Carrega categorias no select do formulário e no filtro
async function carregarCategorias() {
    try {
        const resp = await fetch(`${API_URL}/categorias`);
        const categorias = await resp.json();
        listaCategoriasGlobal = categorias;

        const selectForm = document.getElementById("categoria");
        const selectFiltro = document.getElementById("filtroCategoria");

        selectForm.innerHTML = '<option value="">Selecione</option>';
        selectFiltro.innerHTML = '<option value="">Todas as categorias</option>';

        categorias.forEach(function(cat) {
            const optForm = document.createElement("option");
            optForm.value = cat.id;
            optForm.textContent = cat.nome;
            selectForm.appendChild(optForm);

            const optFiltro = document.createElement("option");
            optFiltro.value = cat.id;
            optFiltro.textContent = cat.nome;
            selectFiltro.appendChild(optFiltro);
        });
    } catch (err) {
        console.error("Erro ao carregar categorias:", err);
    }
}

// Carrega produtos da API
async function carregarProdutos() {
    try {
        const resp = await fetch(`${API_URL}/produtos`);
        const produtos = await resp.json();
        listaProdutosGlobal = produtos;

        carregarResumo();
        filtrarProdutos();
    } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        const aviso = "Não foi possível conectar à API. Verifique se ela está em execução em " + API_URL + ".";
        document.getElementById("cardsProdutos").innerHTML = '<div class="empty-msg" style="grid-column: 1/-1;">' + aviso + '</div>';
        document.getElementById("tabelaProdutos").innerHTML = '<tr><td colspan="8" class="empty-msg">' + aviso + '</td></tr>';
    }
}

// Escapa texto vindo da API antes de inseri-lo via innerHTML
function esc(valor) {
    const div = document.createElement("div");
    div.textContent = valor == null ? "" : String(valor);
    return div.innerHTML;
}

// Atualiza o painel de KPIs com os indicadores calculados pela API (GET /resumo)
async function carregarResumo() {
    try {
        const resp = await fetch(`${API_URL}/resumo`);
        const r = await resp.json();

        document.getElementById("kpiTotalProdutos").textContent = r.total_produtos;
        document.getElementById("kpiEstoqueCritico").textContent = r.estoque_critico;
        document.getElementById("kpiValorEstoque").textContent = "R$ " + r.valor_estoque.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById("kpiTotalCategorias").textContent = r.total_categorias;
        document.getElementById("kpiValidade").textContent = r.vencidos + r.a_vencer;
        document.getElementById("kpiValidadeDetalhe").textContent = r.vencidos + " vencidos · " + r.a_vencer + " a vencer em 30 dias";
    } catch (err) {
        console.error("Erro ao carregar resumo:", err);
    }
}

// Badge de validade (vazio quando nao ha alerta)
function badgeValidade(status) {
    if (status === "vencido") return '<span class="card-badge badge-danger">Vencido</span>';
    if (status === "a_vencer") return '<span class="card-badge badge-warning">Vence em breve</span>';
    return "";
}

// Extrai uma mensagem legivel de uma resposta de erro da API (400/404 ou 422)
async function mensagemDeErro(resp, padrao) {
    try {
        const erro = await resp.json();
        if (erro.erro) return erro.erro;
        if (Array.isArray(erro) && erro.length) {
            const campo = (erro[0].loc || []).join(".");
            return (campo ? campo + ": " : "") + String(erro[0].msg).replace("Value error, ", "");
        }
    } catch (e) { /* corpo nao era JSON */ }
    return padrao;
}

// Filtra produtos com base na busca e na categoria selecionada
function filtrarProdutos() {
    const busca = document.getElementById("inputBusca").value.toLowerCase().trim();
    const catId = document.getElementById("filtroCategoria").value;

    const filtrados = listaProdutosGlobal.filter(p => {
        const bateNomeOuMarca = (p.nome || "").toLowerCase().includes(busca) || (p.marca || "").toLowerCase().includes(busca);
        const bateCategoria = catId === "" || String(p.categoria_id) === String(catId);
        return bateNomeOuMarca && bateCategoria;
    });

    renderizarCards(filtrados);
    renderizarTabela(filtrados);
}

// Renderiza a visualização em Cards
function renderizarCards(produtos) {
    const container = document.getElementById("cardsProdutos");

    if (produtos.length === 0) {
        container.innerHTML = '<div class="empty-msg" style="grid-column: 1/-1;">Nenhum produto encontrado.</div>';
        return;
    }

    container.innerHTML = "";

    produtos.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";

        const isCritico = p.estoque_atual <= p.estoque_minimo;
        const badgeClass = isCritico ? "badge-warning" : "badge-ok";
        const badgeTexto = isCritico ? "Estoque Baixo" : "Em Estoque";

        card.innerHTML = `
            <div>
                <div class="card-header">
                    <span class="card-title">${esc(p.nome)}</span>
                    <span class="card-badges">
                        ${badgeValidade(p.status_validade)}
                        <span class="card-badge ${badgeClass}">${badgeTexto}</span>
                    </span>
                </div>
                <div class="card-details">
                    <span><strong>Categoria:</strong> ${esc(p.categoria_nome) || "-"}</span>
                    <span><strong>Pet:</strong> ${esc(p.tipo_pet) || "Geral"} | <strong>Marca:</strong> ${esc(p.marca) || "-"}</span>
                    <span><strong>Estoque:</strong> ${p.estoque_atual} ${esc(p.unidade_venda) || "UN"} (Mín: ${p.estoque_minimo})</span>
                    <span><strong>Validade:</strong> ${formatarData(p.data_validade)}</span>
                    <div class="card-price">R$ ${Number(p.preco_venda).toFixed(2)}</div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-edit" onclick="editarProduto(${p.id})">✏️ Editar</button>
                <button class="btn-delete" onclick="excluirProduto(${p.id})">🗑️ Excluir</button>
            </div>
        `;

        container.appendChild(card);
    });
}

// Renderiza a visualização em Tabela
function renderizarTabela(produtos) {
    const tbody = document.getElementById("tabelaProdutos");

    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">Nenhum produto encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = "";

    produtos.forEach(p => {
        const tr = document.createElement("tr");
        const isCritico = p.estoque_atual <= p.estoque_minimo;
        const badgeClass = isCritico ? "badge-warning" : "badge-ok";
        const badgeTexto = isCritico ? "Estoque Baixo" : "OK";

        tr.innerHTML = `
            <td><strong>${esc(p.nome)}</strong><br><small style="color:#64748b">${esc(p.marca)}</small></td>
            <td>${esc(p.categoria_nome) || "-"}</td>
            <td>${esc(p.tipo_pet) || "-"}</td>
            <td>${p.estoque_atual} ${esc(p.unidade_venda) || "UN"}</td>
            <td>R$ ${Number(p.preco_venda).toFixed(2)}</td>
            <td>${formatarData(p.data_validade)}</td>
            <td>${badgeValidade(p.status_validade)} <span class="card-badge ${badgeClass}">${badgeTexto}</span></td>
            <td class="actions-cell">
                <button class="btn-edit" onclick="editarProduto(${p.id})">Editar</button>
                <button class="btn-delete" onclick="excluirProduto(${p.id})">Excluir</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Alterna entre o modo Cards e o modo Tabela
function alternarModo(modo) {
    modoVisualizacao = modo;
    const btnCards = document.getElementById("btnModoCards");
    const btnTabela = document.getElementById("btnModoTabela");
    const containerCards = document.getElementById("cardsProdutos");
    const containerTabela = document.getElementById("tabelaContainer");

    if (modo === "cards") {
        btnCards.classList.add("active");
        btnTabela.classList.remove("active");
        containerCards.style.display = "grid";
        containerTabela.style.display = "none";
    } else {
        btnTabela.classList.add("active");
        btnCards.classList.remove("active");
        containerCards.style.display = "none";
        containerTabela.style.display = "block";
    }
}

// Formata data de YYYY-MM-DD para DD/MM/YYYY
function formatarData(data) {
    if (!data) return "-";
    const partes = data.split("-");
    if (partes.length !== 3) return data;
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// Submit do formulário (Adicionar ou Atualizar)
document.getElementById("produtoForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const id = document.getElementById("produtoId").value;

    const produto = {
        nome: document.getElementById("nomeProduto").value,
        codigo_barras: document.getElementById("codigoBarras").value,
        marca: document.getElementById("marca").value,
        categoria_id: parseInt(document.getElementById("categoria").value),
        tipo_pet: document.getElementById("tipoPet").value,
        unidade_venda: document.getElementById("unidadeVenda").value,
        lote: document.getElementById("lote").value,
        estoque_atual: parseInt(document.getElementById("estoqueAtual").value) || 0,
        estoque_minimo: parseInt(document.getElementById("estoqueMinimo").value) || 0,
        custo_aquisicao: parseFloat(document.getElementById("custoAquisicao").value) || 0,
        preco_venda: parseFloat(document.getElementById("precoVenda").value) || 0,
        data_entrada: document.getElementById("dataEntrada").value,
        data_validade: document.getElementById("dataValidade").value
    };

    try {
        let resp;

        if (id) {
            // PUT /produtos/<id>
            resp = await fetch(`${API_URL}/produtos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(produto)
            });
        } else {
            // POST /produtos
            resp = await fetch(`${API_URL}/produtos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(produto)
            });
        }

        if (resp.ok) {
            limparFormulario();
            carregarProdutos();
        } else {
            alert(await mensagemDeErro(resp, "Erro ao salvar produto."));
        }
    } catch (err) {
        console.error("Erro ao salvar produto:", err);
    }
});

// Carrega dados do produto no formulário para edição (GET /produtos/<id>)
async function editarProduto(id) {
    try {
        const resp = await fetch(`${API_URL}/produtos/${id}`);
        const p = await resp.json();

        document.getElementById("produtoId").value = p.id;
        document.getElementById("nomeProduto").value = p.nome;
        document.getElementById("codigoBarras").value = p.codigo_barras || "";
        document.getElementById("marca").value = p.marca || "";
        document.getElementById("categoria").value = p.categoria_id;
        document.getElementById("tipoPet").value = p.tipo_pet || "";
        document.getElementById("unidadeVenda").value = p.unidade_venda || "UN";
        document.getElementById("lote").value = p.lote || "";
        document.getElementById("estoqueAtual").value = p.estoque_atual;
        document.getElementById("estoqueMinimo").value = p.estoque_minimo;
        document.getElementById("custoAquisicao").value = p.custo_aquisicao;
        document.getElementById("precoVenda").value = p.preco_venda;
        document.getElementById("dataEntrada").value = p.data_entrada || "";
        document.getElementById("dataValidade").value = p.data_validade || "";

        document.getElementById("form-title").textContent = "Editar Produto";
        document.getElementById("btnSubmit").textContent = "Salvar alterações";
        document.getElementById("btnCancelar").style.display = "inline-block";

        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
        console.error("Erro ao carregar produto para edição:", err);
    }
}

// Excluir produto (DELETE /produtos/<id>)
async function excluirProduto(id) {
    if (!confirm("Deseja realmente excluir este produto?")) return;

    try {
        const resp = await fetch(`${API_URL}/produtos/${id}`, {
            method: "DELETE"
        });

        if (resp.ok) {
            carregarProdutos();
        } else {
            alert(await mensagemDeErro(resp, "Erro ao excluir produto."));
        }
    } catch (err) {
        console.error("Erro ao excluir produto:", err);
    }
}

// Cancelar edição
function cancelarEdicao() {
    limparFormulario();
}

// Limpar formulário
function limparFormulario() {
    document.getElementById("produtoForm").reset();
    document.getElementById("produtoId").value = "";
    document.getElementById("form-title").textContent = "Adicionar Produto";
    document.getElementById("btnSubmit").textContent = "Adicionar produto";
    document.getElementById("btnCancelar").style.display = "none";
}

// Inicialização
carregarCategorias();
carregarProdutos();
