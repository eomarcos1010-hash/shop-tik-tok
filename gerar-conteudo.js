export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

    const { productName, price, description, type, quantity } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
        return res.status(500).json({ success: false, mensagem: 'Chave da IA não configurada' });
    }

    const instrucoesPorTipo = {
        hooks: `
Você é especialista em ganchos virais para TikTok Shop.

PRODUTO: ${productName}
PREÇO: ${price}
DESCRIÇÃO: ${description}

Gere EXATAMENTE ${quantity} ganchos curtos e chamativos.
- Cada gancho em uma linha separada
- Sem numeração, sem traços, sem explicações
- Frases naturais, como pessoa falando
- Usar gatilhos: curiosidade, identificação, urgência, prova
- Basear nas informações do produto
- Em português brasileiro`,

        script: `
Você cria roteiros completos de vendas para TikTok Shop.

PRODUTO: ${productName}
PREÇO: ${price}
DESCRIÇÃO: ${description}

Estruture o roteiro assim:

🔥 GANCHO — Frase que prende nos 3 primeiros segundos
👋 APRESENTAÇÃO — Apresenta o produto de forma natural
📖 DESENVOLVIMENTO — Explica o que é e como funciona
✨ BENEFÍCIOS — Principais vantagens
💰 PREÇO — Destaque o valor
🛒 CHAMADA PARA AÇÃO — Convida a comprar com urgência

Regras: Tom de conversa, curto e direto, português brasileiro.`,

        ideas: `
Você cria ideias de vídeos para vender no TikTok Shop.

PRODUTO: ${productName}
PREÇO: ${price}
DESCRIÇÃO: ${description}

Gere EXATAMENTE ${quantity} ideias de vídeos. Para cada ideia use:

TÍTULO: nome simples
CONCEITO: o que mostrar no vídeo
COMO GRAVAR: passo a passo simples
GANCHO: frase de abertura
CHAMADA PARA AÇÃO: frase final para comprar

Seja prático e criativo. Português brasileiro.`,

        ad: `
Você cria textos de anúncios prontos para TikTok Shop.

PRODUTO: ${productName}
PREÇO: ${price}
DESCRIÇÃO: ${description}

Estruture assim:

🔥 GANCHO — Chamada que chama atenção
✨ BENEFÍCIOS — O que ele traz de bom
🔥 OFERTA — Destaque o preço
📝 PROVA — Por que vale a pena
🛒 CHAMADA PARA AÇÃO — Urgência + link

Tom convincente, curto e direto.`
    };

    const prompt = instrucoesPorTipo[type] || instrucoesPorTipo.hooks;

    try {
        const respostaIA = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                temperature: 0.85,
                max_tokens: 1800,
                messages: [
                    { role: 'system', content: 'Você é um especialista em conteúdo de vendas para TikTok Shop. Responda apenas com o conteúdo solicitado, sem comentários, sem apresentação.' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        const dadosIA = await respostaIA.json();
        if (!respostaIA.ok) throw new Error(dadosIA.error?.message || 'Erro na IA');

        const textoGerado = dadosIA.choices[0].message.content.trim();
        let content = [];

        if (type === 'hooks') {
            content = textoGerado.split('\n').filter(linha => linha.trim().length > 8).map(linha => linha.replace(/^[0-9.\-•) ]+\s*/, '').trim());
        } else {
            content = [textoGerado];
        }

        return res.status(200).json({ success: true, content });

    } catch (erro) {
        console.error('ERRO:', erro);
        return res.status(500).json({ success: false, mensagem: erro.message || 'Falha ao gerar conteúdo' });
    }
}
