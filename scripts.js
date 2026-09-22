const API_URL = "http://127.0.0.1:5001";

// Carrega categorias no select
async function carregarCategorias() {
    try {
        const resp = await fetch(`${API_URL}/categorias`);
        const categorias = await resp.json();
        const select = document.getElementById("categoria");

        // Mantém a primeira opção "Selecione"
        select.innerHTML = '<option value="">Selecione</option>';

        categorias.forEach(function(cat) {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = cat.nome;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Erro ao carregar categorias:", err);
    }
}

// Carrega produtos na tabela
async function carregarProdutos() {
    try {
        const resp = await fetch(`${API_URL}/produtos`);
        const produtos = await resp.json();
        const tbody = document.getElementById("tabelaProdutos");

        if (produtos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Nenhum produto cadastrado.</td></tr>';
            return;
        }

        tbody.innerHTML = "";

        produtos.forEach(function(p) {
            const tr = document.createElement("tr");

            tr.innerHTML =
                "<td>" + p.nome + "</td>" +
                "<td>" + (p.categoria_nome || "-") + "</td>" +
                "<td>" + (p.tipo_pet || "-") + "</td>" +
                "<td>" + p.estoque_atual + "</td>" +
                "<td>" + Number(p.preco_venda).toFixed(2) + "</td>" +
                "<td>" + formatarData(p.data_validade) + "</td>" +
                '<td class="actions-cell">' +
                    '<button class="btn-edit" onclick="editarProduto(' + p.id + ')">Editar</button>' +
                    '<button class="btn-delete" onclick="excluirProduto(' + p.id + ')">Excluir</button>' +
                '</td>';

            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Erro ao carregar produtos:", err);
    }
}

// Formata data de YYYY-MM-DD para DD/MM/YYYY
function formatarData(data) {
    if (!data) return "-";
    const partes = data.split("-");
    if (partes.length !== 3) return data;
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// Submit do formulário (adicionar ou atualizar)
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
            // Atualizar
            resp = await fetch(`${API_URL}/produtos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(produto)
            });
        } else {
            // Adicionar
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
            const erro = await resp.json();
            alert(erro.erro || "Erro ao salvar produto.");
        }
    } catch (err) {
        console.error("Erro ao salvar produto:", err);
    }
});

// Carregar dados do produto no formulário para edição
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

// Excluir produto
async function excluirProduto(id) {
    if (!confirm("Deseja realmente excluir este produto?")) return;

    try {
        const resp = await fetch(`${API_URL}/produtos/${id}`, {
            method: "DELETE"
        });

        if (resp.ok) {
            carregarProdutos();
        } else {
            alert("Erro ao excluir produto.");
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
