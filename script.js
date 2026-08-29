// ==========================================
// HOOKSHOP AI - CONFIGURAÇÃO
// ==========================================

// ⚙️ ENDEREÇO DA API:
// - Teste local: deixe "/api/gerar-conteudo"
// - Após publicar na Vercel: coloque: "https://SEU-DOMINIO.vercel.app/api/gerar-conteudo"
const API_URL = "/api/gerar-conteudo"; 

// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================
let generatedContent = [];
let lastPayload = null;
let history = JSON.parse(localStorage.getItem('hookshop_history') || '[]');
let favorites = JSON.parse(localStorage.getItem('hookshop_favorites') || '[]');

const loadingSteps = [
    "CONSULTANDO INTELIGÊNCIA ARTIFICIAL...",
    "ANALISANDO O PRODUTO...",
    "CRIANDO ESTRATÉGIAS DE VENDA...",
    "FINALIZANDO SEU CONTEÚDO..."
];

// ==========================================
// ELEMENTOS DA INTERFACE
// ==========================================
const form = document.getElementById('generatorForm');
const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const productDescInput = document.getElementById('productDesc');
const contentTypeSelect = document.getElementById('contentType');
const quantitySelect = document.getElementById('quantity');
const generateBtn = document.getElementById('generateBtn');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const errorBox = document.getElementById('errorMessages');
const resultsArea = document.getElementById('resultsArea');
const resultsContent = document.getElementById('resultsContent');
const copyAllBtn = document.getElementById('copyAllBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const menuToggle = document.getElementById('menuToggle');
const navMobile = document.getElementById('navMobile');
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const uploadPreview = document.getElementById('uploadPreview');
const favoritesContent = document.getElementById('favoritesContent');
const historyContent = document.getElementById('historyContent');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    animateCounters();
    renderFavorites();
    renderHistory();
});

// ==========================================
// ANIMAÇÃO DOS NÚMEROS
// ==========================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        let current = 0;
        const step = target / 30;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 50);
    });
}

// ==========================================
// MENU MOBILE
// ==========================================
menuToggle.addEventListener('click', () => {
    navMobile.classList.toggle('active');
});

// ==========================================
// UPLOAD DE IMAGEM
// ==========================================
uploadArea.addEventListener('click', () => imageInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleImage(e.dataTransfer.files[0]);
});
imageInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleImage(e.target.files[0]);
});

function handleImage(file) {
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type)) {
        alert('Formato de imagem não suportado.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        uploadArea.querySelector('.upload-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// ==========================================
// VALIDAÇÃO DO FORMULÁRIO
// ==========================================
function validateForm() {
    const errors = [];
    if (!productNameInput.value.trim()) errors.push("• Nome do produto é obrigatório.");
    if (!productPriceInput.value.trim()) errors.push("• Preço é obrigatório.");
    if (!productDescInput.value.trim()) errors.push("• Descrição é obrigatória.");
    const qty = parseInt(quantitySelect.value);
    if (isNaN(qty) || qty < 1 || qty > 50) errors.push("• Quantidade inválida.");
    
    errorBox.innerHTML = errors.join('<br>');
    return errors.length === 0;
}

// ==========================================
// FUNÇÃO PRINCIPAL DE GERAÇÃO
// ==========================================
async function generateContent() {
    if (!validateForm()) return;

    const payload = {
        productName: productNameInput.value.trim(),
        price: productPriceInput.value.trim(),
        description: productDescInput.value.trim(),
        type: contentTypeSelect.value,
        quantity: parseInt(quantitySelect.value)
    };

    lastPayload = payload;

    // EXIBINDO LOADING
    generateBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'block';
    resultsArea.style.display = 'none';
    errorBox.innerHTML = "";

    // SIMULAÇÃO DE PASSOS DE CARREGAMENTO
    for (let i = 0; i < loadingSteps.length; i++) {
        btnLoading.textContent = loadingSteps[i];
        await new Promise(r => setTimeout(r, 700));
    }

    let result;
    if (API_URL && API_URL.length > 5) {
        // 🤖 MODO IA — CHAMANDO A INTELIGÊNCIA ARTIFICIAL
        result = await callAPI(payload);
        // Se a IA falhar → volta automático para o modo demonstração
        if (!result.success) {
            errorBox.innerHTML = "⚠️ " + (result.message || "IA indisponível") + " → Usando modo inteligente...";
            await new Promise(r => setTimeout(r, 1500));
            result = await generateDemoContent(payload);
        }
    } else {
        // 🧪 MODO DEMONSTRAÇÃO LOCAL
        result = await generateDemoContent(payload);
    }

    // FINALIZANDO LOADING
    generateBtn.disabled = false;
    btnText.style.display = 'block';
    btnLoading.style.display = 'none';

    if (result.success) {
        generatedContent = result.content;
        renderResults(payload.type);
        saveToHistory(payload, result.content);
    } else {
        errorBox.innerHTML = "❌ Erro: " + (result.message || "Não foi possível gerar o conteúdo.");
    }
}

// ==========================================
// 🤖 CHAMADA PARA A IA (GROQ / LLAMA 3.3)
// ==========================================
async function callAPI(payload) {
    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const dados = await resposta.json();

        if (dados.success && Array.isArray(dados.content)) {
            return { success: true, content: dados.content };
        }

        return { success: false, message: dados.mensagem || "Resposta inválida da IA" };

    } catch (erro) {
        console.error('Erro ao chamar IA:', erro);
        return { success: false, message: "Falha na conexão com a IA" };
    }
}

// ==========================================
// 🧪 MODO DEMONSTRAÇÃO — GANCHOS INTELIGENTES
// ==========================================
async function generateDemoContent(payload) {
    const { productName, price, description, type, quantity } = payload;
    const content = [];
    const info = extractInfo(description, productName, price);

    // 🎯 15 ESTRUTURAS COMPROVADAS — SEMPRE DIFERENTES
    const hookFormulas = [
        () => `Se você sofre com ${info.dor}, precisa conhecer esse ${productName}`,
        () => `O detalhe do ${productName} que ninguém te conta é esse...`,
        () => `A maioria das pessoas usa o ${productName} completamente errado!`,
        () => `Eu não acreditava que o ${productName} mudaria tanto as coisas até testar...`,
        () => `Eu gastei R$ 200,00 testando opções e o ${productName} de ${price} foi o único que valeu a pena`,
        () => `Pare de comprar ${info.categoria} que não dura! Esse ${productName} é diferente`,
        () => `Por que os vendedores de ${productName} escondem esse detalhe de você?`,
        () => `Paguei mais caro por outro e o ${productName} de ${price} é MUITO melhor`,
        () => `Você também achava que todos os ${info.categoria} eram iguais? Veja isso!`,
        () => `Em pouco tempo usando o ${productName} já percebi ${info.beneficioCurto}`,
        () => `Opinião sincera: esse ${productName} supera marcas famosas e custa ${price}`,
        () => `Ninguém te avisa sobre isso antes de comprar um ${productName}...`,
        () => `7 motivos para o ${productName} ser o melhor investimento de ${price}`,
        () => `Eu quase desisti de encontrar um bom ${info.categoria} até achar esse ${productName}`,
        () => `O ${productName} por apenas ${price}? Corre porque não vai durar!`
    ];

    if (type === 'hooks') {
        const shuffled = hookFormulas.sort(() => Math.random() - 0.5);
        for (let i = 0; i < quantity; i++) {
            const formula = shuffled[i % shuffled.length];
            content.push(formula());
        }
    } else if (type === 'script') {
        content.push({
            gancho: `Se você quer ${info.desejo}, preste atenção nesse ${productName}!`,
            apresentacao: `Olá! Hoje eu trago algo que realmente vale a pena: o ${productName}`,
            desenvolvimento: `${productName} se destaca porque resolve exatamente ${info.dor}. ${description.substring(0, 130)}...`,
            beneficio: `✅ Principais vantagens: ${info.beneficios.join(', ')}.`,
            preco: `💰 E o melhor: custa apenas ${price}! Um valor excelente por tudo que entrega.`,
            cta: `🛒 Clica no link e garanta o seu! Estoque limitado por esse preço!`
        });
    } else if (type === 'ideas') {
        content.push(
            { titulo: 'Dor → Solução direta', conceito: 'Mostre o problema e o produto resolvendo', comoGravar: 'Comece mostrando o problema, depois o produto em ação', gancho: `Cansado de ${info.dor}? O ${productName} resolve de uma vez!`, cta: 'Aproveita pelo link na bio!' },
            { titulo: 'Comparação real', conceito: 'Mostre produto comum × esse produto', comoGravar: 'Lado a lado, sem mentir', gancho: `Por que esse ${productName} de ${price} é melhor que os caros?`, cta: 'Confira pelo link!' },
            { titulo: 'Teste sem cortes', conceito: 'Mostre o produto funcionando ao vivo', comoGravar: 'Sem editar, mostre cada detalhe', gancho: `Testei o ${productName} sem cortes e o resultado me surpreendeu!`, cta: 'Não perca!' },
            { titulo: 'Antes e Depois', conceito: 'Mostre a transformação real', comoGravar: 'Estado inicial → resultado após uso', gancho: `Veja o que o ${productName} consegue fazer!`, cta: 'Garanta o seu!' },
            { titulo: 'Verdade crua', conceito: 'Fale como conselho de amigo', comoGravar: 'Olha na câmera, sincero', gancho: `Eu não recomendaria o ${productName} se não funcionasse de verdade...`, cta: 'Clica no link!' }
        );
    } else if (type === 'ad') {
        content.push({
            gancho: `Antes de comprar qualquer ${info.categoria}, veja esse ${productName}!`,
            beneficio: `${productName}: ${info.beneficios.slice(0,3).join('. ')}.`,
            oferta: `🔥 Preço especial: ${price}!`,
            prova: `${description.substring(0, 100)}... É por isso que está sendo tão recomendado!`,
            cta: `🛒 Clica no link e aproveita! Estoque limitado!`
        });
    }

    return { success: true, content };
}

// ==========================================
// EXTRAI INFORMAÇÕES DA DESCRIÇÃO
// ==========================================
function extractInfo(description, productName, price) {
    const defaults = {
        dor: 'perder tempo e dinheiro com produtos que não entregam',
        beneficios: ['qualidade superior', 'ótimo custo-benefício', 'fácil uso'],
        categoria: 'produto',
        desejo: 'resultados reais sem complicações',
        beneficioCurto: 'mudanças reais'
    };

    if (!description || description.length < 10) return defaults;

    let categoria = defaults.categoria;
    if (productName.match(/fone|ouvido|bluetooth|audio/i)) categoria = 'fones de ouvido';
    else if (productName.match(/capa|proteção|case/i)) categoria = 'capas e proteções';
    else if (productName.match(/espátula|escova|limpeza/i)) categoria = 'produtos de limpeza';
    else if (productName.match(/bolsa|mochila|carteira/i)) categoria = 'acessórios';
    else if (productName.match(/cozinha|panela|utensílio/i)) categoria = 'utensílios de cozinha';
    else if (productName.match(/cuidado|pele|rosto|beleza/i)) categoria = 'produtos de beleza';

    const palavras = description.split(/[,.;\s]+/).filter(p => p.length > 4);
    const beneficios = palavras.length >= 3 ? palavras.slice(0, 4) : defaults.beneficios;

    const dorPorCategoria = {
        'fones de ouvido': 'ter som ruim e bateria que acaba rápido',
        'capas e proteções': 'trocar toda hora porque estraga',
        'produtos de limpeza': 'perder tempo e esforço sem resultado',
        'acessórios': 'pagar caro por algo que dura pouco',
        'utensílios de cozinha': 'comprar coisas que não funcionam como prometido',
        'produtos de beleza': 'gastar sem ver resultado de verdade'
    };

    return {
        ...defaults,
        categoria,
        dor: dorPorCategoria[categoria] || defaults.dor,
        beneficios
    };
}

// ==========================================
// RENDERIZAÇÃO DOS RESULTADOS
// ==========================================
function renderResults(type) {
    resultsArea.style.display = 'block';
    resultsContent.innerHTML = '';

    if (type === 'hooks') {
        generatedContent.forEach((text, idx) => {
            const card = createHookCard(text, idx);
            card.style.animationDelay = `${idx * 0.1}s`;
            resultsContent.appendChild(card);
        });
    } else if (type === 'script') {
        resultsContent.appendChild(createScriptCard(generatedContent[0]));
    } else if (type === 'ideas') {
        generatedContent.forEach((idea, idx) => {
            const card = createIdeaCard(idea, idx);
            card.style.animationDelay = `${idx * 0.1}s`;
            resultsContent.appendChild(card);
        });
    } else if (type === 'ad') {
        resultsContent.appendChild(createAdCard(generatedContent[0]));
    }
}

function createHookCard(text, idx) {
    const isFav = favorites.some(f => f.text === text);
    const card = document.createElement('div');
    card.className = 'hook-card';
    card.innerHTML = `
        <div class="hook-content">
            <p class="hook-text">${text}</p>
            <div class="hook-actions">
                <button class="copy-btn" data-text="${encodeURIComponent(text)}">📋 COPIAR</button>
                <button class="fav-btn ${isFav ? 'active' : ''}" data-text="${encodeURIComponent(text)}">${isFav ? '♥' : '♡'}</button>
            </div>
        </div>`;
    return card;
}

function createScriptCard(data) {
    const fullText = typeof data === 'string' ? data : Object.values(data).join('\n\n');
    const card = document.createElement('div');
    card.className = 'script-card';
    card.innerHTML = `
        <div class="script-section"><div class="script-label">🔥 GANCHO</div><div>${extrairParte(data, 'gancho')}</div></div>
        <div class="script-section"><div class="script-label">👋 APRESENTAÇÃO</div><div>${extrairParte(data, 'apresentação|apresentacao')}</div></div>
        <div class="script-section"><div class="script-label">📖 DESENVOLVIMENTO</div><div>${extrairParte(data, 'desenvolvimento')}</div></div>
        <div class="script-section"><div class="script-label">✨ BENEFÍCIO</div><div>${extrairParte(data, 'benefício|beneficio')}</div></div>
        <div class="script-section"><div class="script-label">💰 PREÇO</div><div>${extrairParte(data, 'preço|preco')}</div></div>
        <div class="script-section"><div class="script-label">🛒 CHAMADA PARA AÇÃO</div><div>${extrairParte(data, 'cta|chamada')}</div></div>
        <button class="copy-btn" data-text="${encodeURIComponent(fullText)}">📋 COPIAR ROTEIRO</button>`;
    return card;
}

function extrairParte(textoOuObj, padrao) {
    if (typeof textoOuObj === 'object') {
        const valores = Object.values(textoOuObj).join('\n');
        const r = new RegExp(`(${padrao})[:\\s]*(.*)`, 'i');
        const m = valores.match(r);
        return m ? m[2].trim() : valores.substring(0, 150);
    }
    const r = new RegExp(`(${padrao})[:\\s]*(.*)`, 'i');
    const m = textoOuObj.match(r);
    return m ? m[2].trim() : textoOuObj.substring(0, 120);
}

function createIdeaCard(idea, idx) {
    const fullText = typeof idea === 'string' ? idea : `${idea.titulo}\nConceito: ${idea.conceito}\nComo gravar: ${idea.comoGravar}\nGancho: ${idea.gancho}\nCTA: ${idea.cta}`;
    const card = document.createElement('div');
    card.className = 'idea-card';
    card.innerHTML = `
        <h4 class="idea-title">💡 ${idx + 1}. ${typeof idea === 'object' ? idea.titulo : 'Ideia ' + (idx + 1)}</h4>
        <p class="idea-part"><strong>Conceito:</strong> ${typeof idea === 'object' ? idea.conceito : idea}</p>
        <button class="copy-btn" data-text="${encodeURIComponent(fullText)}">📋 COPIAR IDEIA</button>`;
    return card;
}

function createAdCard(data) {
    const fullText = typeof data === 'string' ? data : Object.values(data).join('\n\n');
    const card = document.createElement('div');
    card.className = 'ad-card';
    card.innerHTML = `
        <div class="script-section"><div class="script-label">🔥 GANCHO</div><div>${extrairParte(data, 'gancho')}</div></div>
        <div class="script-section"><div class="script-label">✨ BENEFÍCIO</div><div>${extrairParte(data, 'benefício|beneficio')}</div></div>
        <div class="script-section"><div class="script-label">🔥 OFERTA</div><div>${extrairParte(data, 'oferta|preço')}</div></div>
        <div class="script-section"><div class="script-label">📝 PROVA</div><div>${extrairParte(data, 'prova|descrição')}</div></div>
        <div class="script-section"><div class="script-label">🛒 CHAMADA PARA AÇÃO</div><div>${extrairParte(data, 'cta|chamada')}</div></div>
        <button class="copy-btn" data-text="${encodeURIComponent(fullText)}">📋 COPIAR ANÚNCIO</button>`;
    return card;
}

// ==========================================
// COPIAR PARA ÁREA DE TRANSFERÊNCIA
// ==========================================
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('copy-btn')) {
        const text = decodeURIComponent(e.target.dataset.text);
        await navigator.clipboard.writeText(text);
        e.target.textContent = '✓ COPIADO';
        e.target.classList.add('copied');
        setTimeout(() => {
            e.target.textContent = '📋 COPIAR';
            e.target.classList.remove('copied');
        }, 2500);
    }

    if (e.target.classList.contains('fav-btn')) {
        const text = decodeURIComponent(e.target.dataset.text);
        toggleFavorite(text, e.target);
    }
});

// ==========================================
// COPIAR TODOS OS RESULTADOS
// ==========================================
copyAllBtn.addEventListener('click', async () => {
    const allText = generatedContent.map(item => {
        if (typeof item === 'string') return item;
        return Object.values(item).join('\n\n');
    }).join('\n\n——————————————\n\n');

    await navigator.clipboard.writeText(allText);
    copyAllBtn.textContent = '✓ COPIADO';
    setTimeout(() => {
        copyAllBtn.textContent = '📋 COPIAR TODOS';
    }, 2500);
});

// ==========================================
// GERAR NOVAMENTE
// ==========================================
regenerateBtn.addEventListener('click', async () => {
    if (!lastPayload) return;
    await generateContent();
});

// ==========================================
// FAVORITOS
// ==========================================
function toggleFavorite(text, btn) {
    const exists = favorites.findIndex(f => f.text === text);
    if (exists >= 0) {
        favorites.splice(exists, 1);
        btn.textContent = '♡';
        btn.classList.remove('active');
    } else {
        favorites.push({ text, createdAt: new Date().toISOString() });
        btn.textContent = '♥';
        btn.classList.add('active');
    }
    localStorage.setItem('hookshop_favorites', JSON.stringify(favorites));
    renderFavorites();
}

function renderFavorites() {
    if (!favorites.length) {
        favoritesContent.innerHTML = `<p class="empty-message">Nenhum favorito salvo ainda. Ao gerar conteúdo, clique no ♡ para salvar.</p>`;
        return;
    }
    favoritesContent.innerHTML = favorites.map((f) => `
        <div class="hook-card">
            <div class="hook-content">
                <p class="hook-text">${f.text}</p>
                <div class="hook-actions">
                    <button class="copy-btn" data-text="${encodeURIComponent(f.text)}">📋</button>
                    <button class="fav-btn active" data-text="${encodeURIComponent(f.text)}">♥</button>
                </div>
            </div>
        </div>`).join('');
}

// ==========================================
// HISTÓRICO
// ==========================================
function saveToHistory(payload, content) {
    const record = {
        id: Date.now(),
        productName: payload.productName,
        type: payload.type,
        quantity: payload.quantity,
        content: content,
        createdAt: new Date().toLocaleDateString('pt-BR')
    };
    history.unshift(record);
    if (history.length > 20) history.pop();
    localStorage.setItem('hookshop_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    if (!history.length) {
        historyContent.innerHTML = `<p class="empty-message">Nenhum histórico encontrado. Comece gerando algum conteúdo acima!</p>`;
        return;
    }
    historyContent.innerHTML = history.map(item => {
        const typeLabel = { hooks: 'Ganchos', script: 'Roteiro', ideas: 'Ideias', ad: 'Anúncio' }[item.type];
        return `
        <div class="history-item">
            <div class="history-info">
                <h4>${item.productName}</h4>
                <p>${typeLabel} • ${item.quantity} itens • ${item.createdAt}</p>
            </div>
            <div class="history-actions">
                <button class="btn btn-secondary btn-sm" data-id="${item.id}" data-action="open">Abrir</button>
                <button class="btn btn-secondary btn-sm" data-id="${item.id}" data-action="delete">Excluir</button>
            </div>
        </div>`;
    }).join('');
}

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Deseja limpar todo o histórico?')) {
        history = [];
        localStorage.removeItem('hookshop_history');
        renderHistory();
    }
});

historyContent.addEventListener('click', (e) => {
    if (!e.target.dataset.id) return;
    const id = parseInt(e.target.dataset.id);
    const action = e.target.dataset.action;
    const idx = history.findIndex(h => h.id === id);
    if (idx === -1) return;

    if (action === 'open') {
        lastPayload = {
            productName: history[idx].productName,
            type: history[idx].type,
            quantity: history[idx].quantity
        };
        generatedContent = history[idx].content;
        productNameInput.value = lastPayload.productName;
        contentTypeSelect.value = lastPayload.type;
        quantitySelect.value = lastPayload.quantity;
        renderResults(lastPayload.type);
        resultsArea.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'delete') {
        history.splice(idx, 1);
        localStorage.setItem('hookshop_history', JSON.stringify(history));
        renderHistory();
    }
});

// ==========================================
// ENVIO DO FORMULÁRIO
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await generateContent();
});