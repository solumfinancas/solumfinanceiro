import { IncomingMessage } from 'http';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Desativar bodyParser padrão para receber o PDF binário bruto
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  // 1. Obter cabeçalhos de autorização
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }));
  }

  try {
    // 2. Ler o buffer de PDF bruto
    const pdfBuffer = await getRawBody(req);
    if (!pdfBuffer || pdfBuffer.length === 0) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Empty PDF body' }));
    }

    // 3. Extrair texto do PDF
    const pdfParser = typeof pdf === 'function' ? pdf : (pdf.default || pdf);
    const pdfData = await pdfParser(pdfBuffer);
    const pdfText = pdfData.text;
    if (!pdfText || pdfText.trim().length === 0) {
      res.statusCode = 422;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Could not extract text from PDF' }));
    }

    // 4. Inicializar OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'OPENAI_API_KEY not configured on backend' }));
    }
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // 5. Inicializar cliente do Supabase com o JWT do usuário
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Supabase credentials not configured on backend' }));
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Validar usuário e obter perfil/ID
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Unauthorized: Invalid token' }));
    }

    // 6. Chamar OpenAI para extrair a lista estruturada de transações
    const extractPrompt = `
Você é um assistente financeiro de alta performance especializado em ler extratos bancários em PDF.
Abaixo está o texto bruto extraído de um extrato bancário. Analise-o e extraia todas as transações financeiras.

Extraia as seguintes informações para cada transação:
- date: A data da transação no formato YYYY-MM-DD. Se o ano não for explícito na linha da transação, deduza com base na data do extrato ou use o ano atual.
- description: A descrição detalhada e enriquecida da transação. Você deve ler todas as linhas e detalhes referentes a essa transação no extrato.
  IMPORTANTE: Evite descrições genéricas e sem contexto como apenas "PIX", "TRANSFERENCIA", "TED", "DOC", "COMPRA NO DEBITO".
  Você DEVE buscar e concatenar o nome do favorecido, pagador, estabelecimento, empresa, pessoa física/jurídica ou identificador do serviço relevante na descrição (ex: em vez de "PIX ENVIADO", extraia "PIX ENVIADO - RAONY DE ARAUJO NUNES"; em vez de "COMPRA CARTAO", extraia "COMPRA CARTAO - NETFLIX.COM"; em vez de "TED RECEBIDO", extraia "TED RECEBIDO - EDITORA ABRIL LTDA").
- amount: O valor absoluto da transação como um número decimal positivo (ex: 45.90, 1500.00).
- type: O tipo da transação. Deve ser "income" para entradas/créditos/receitas, ou "expense" para saídas/débitos/despesas/pagamentos.

Formato de resposta esperado:
Retorne APENAS um objeto JSON válido, sem markdown ou explicações, no seguinte formato:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "...",
      "amount": 12.34,
      "type": "expense"
    }
  ]
}

Texto bruto do extrato:
---
${pdfText}
---
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: extractPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const aiResponseText = completion.choices[0]?.message?.content;
    if (!aiResponseText) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'OpenAI returned empty response' }));
    }

    const parsedJson = JSON.parse(aiResponseText) as {
      transactions: Array<{ date: string; description: string; amount: number; type: 'income' | 'expense' }>;
    };
    
    const rawTransactions = parsedJson.transactions;

    if (!rawTransactions || !Array.isArray(rawTransactions)) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Failed to parse transactions list from AI output' }));
    }

    // 7. Obter as categorias ativas do próprio usuário para busca cascata e OpenAI
    const { data: userCategories, error: catsError } = await supabase
      .from('categories')
      .select('*')
      .eq('isActive', true)
      .order('name');
    
    if (catsError) throw catsError;

    // Criar um mapeamento de nome completo (e também nome da subcategoria apenas) para ID
    const categoriesMap = new Map<string, string>();
    const parents = userCategories.filter(c => !c.parentId);
    parents.forEach(p => {
      // Mapear categoria principal
      categoriesMap.set(p.name.toLowerCase(), p.id);
      
      const children = userCategories.filter(c => c.parentId === p.id);
      children.forEach(c => {
        // Mapear subcategoria por nome completo "Pai > Filho"
        categoriesMap.set(`${p.name} > ${c.name}`.toLowerCase(), c.id);
        // Mapear também por nome do filho apenas, caso a IA ou memórias sugiram apenas o nome da subcategoria
        if (!categoriesMap.has(c.name.toLowerCase())) {
          categoriesMap.set(c.name.toLowerCase(), c.id);
        }
      });
    });

    // Função de normalização de descrição equivalente à do banco Postgres
    const normalizeDescriptionJs = (text: string): string => {
      if (!text) return '';
      let n = text.toUpperCase();
      n = n.replace(/\s+/g, ' ');
      n = n.replace(/\d{2}\/\d{2}(\/\d{4})?/g, '');
      n = n.replace(/\d+/g, '');
      n = n.replace(/\b(PIX|TED|DOC|COMPRA|PAGAMENTO|PGTO|PAGTO|CARTAO|ESTAB|TAR|TRANSF|TRANSFERENCIA|VALOR|SALDO|DEBITO|CREDITO|AUTO|COMPRAS)\b/g, '');
      n = n.replace(/[^A-Z\s]/g, '');
      n = n.replace(/\s+/g, ' ');
      n = n.trim();
      if (!n) {
        n = text.toUpperCase().replace(/\s+/g, ' ').trim();
      }
      return n;
    };

    // Preparar lista final de transações categorizadas
    const processedTransactions = [];

    // Faremos o processamento em cascata para cada transação
    for (const tx of rawTransactions) {
      const descNorm = normalizeDescriptionJs(tx.description);
      let categoryId = '';
      let mappingSource = '';

      // Nível 1: Memória Individual do Cliente
      if (descNorm) {
        const { data: individualPattern } = await supabase
          .from('user_category_patterns')
          .select('category_id')
          .eq('user_id', user.id)
          .eq('description_pattern', descNorm)
          .maybeSingle();

        if (individualPattern?.category_id) {
          categoryId = individualPattern.category_id;
          mappingSource = 'individual_memory';
        }
      }

      // Nível 2: Memória Global da Plataforma
      if (!categoryId && descNorm && descNorm.length >= 3) {
        const { data: globalPatterns } = await supabase
          .from('global_category_patterns')
          .select('category_name, occurrences')
          .eq('description_pattern', descNorm)
          .order('occurrences', { ascending: false });

        if (globalPatterns && globalPatterns.length > 0) {
          const totalOccurrences = globalPatterns.reduce((acc, curr) => acc + (curr.occurrences || 0), 0);
          const topPattern = globalPatterns[0];
          const occurrences = topPattern.occurrences || 0;
          const confidence = totalOccurrences > 0 ? occurrences / totalOccurrences : 0;

          // Sugerir apenas se tivermos mais de 3 ocorrências totais e confiança >= 70%
          if (totalOccurrences >= 3 && confidence >= 0.7) {
            const mappedCatId = categoriesMap.get(topPattern.category_name.toLowerCase());
            if (mappedCatId) {
              categoryId = mappedCatId;
              mappingSource = 'global_memory';
            }
          }
        }
      }

      // Nível 3: OpenAI (Caso não tenha sido categorizado)
      if (!categoryId) {
        // Obter os pais e filhos formatados de forma hierárquica do tipo correto
        const parentsList = userCategories.filter(c => !c.parentId && c.type === tx.type);
        const categoriesFormattedList: string[] = [];
        parentsList.forEach(p => {
          categoriesFormattedList.push(`- ${p.name} (ID: ${p.id}) [Categoria Principal]`);
          const children = userCategories.filter(c => c.parentId === p.id && c.type === tx.type);
          children.forEach(c => {
            categoriesFormattedList.push(`- ${p.name} > ${c.name} (ID: ${c.id}) [Subcategoria de ${p.name}]`);
          });
        });
        const categoriesList = categoriesFormattedList.join('\n');

        if (categoriesList.length > 0) {
          const suggestPrompt = `
Você é um especialista em classificação de transações financeiras pessoais e empresariais.
Com base na descrição da transação e no seu tipo, sugira a categoria ou subcategoria mais adequada a partir da lista de categorias reais do usuário fornecida abaixo.

Transação:
- Descrição: "${tx.description}"
- Tipo: "${tx.type === 'income' ? 'Receita' : 'Despesa'}"

Categorias Disponíveis:
${categoriesList}

Regras:
1. Responda APENAS com um objeto JSON no formato:
{
  "category_id": "UUID_DA_CATEGORIA_SELECIONADA",
  "confidence": 0.0 a 1.0 (número indicando sua confiança na sugestão)
}
2. Dê preferência absoluta para subcategorias (no formato "Pai > Filho") se forem mais específicas para a transação do que a categoria principal (ex: se for uma compra de supermercado e houver "Alimentação > Mercado", selecione o ID de "Alimentação > Mercado" e NÃO o ID de "Alimentação" principal).
3. Nunca retorne um ID que não exista na lista fornecida.
4. Se você estiver muito inseguro sobre qual categoria escolher, selecione a categoria de fallback mais genérica (como "Outros", "Outras receitas" ou qualquer outra categoria geral do tipo correto) em vez de deixar em branco.
`;

          try {
            const suggestCompletion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: suggestPrompt }],
              response_format: { type: 'json_object' },
              temperature: 0.1,
            });

            const suggestResText = suggestCompletion.choices[0]?.message?.content;
            if (suggestResText) {
              const suggestRes = JSON.parse(suggestResText) as { category_id: string | null; confidence: number };
              // Confiança limite de 60% para aceitar a sugestão da OpenAI
              if (suggestRes.category_id && suggestRes.confidence >= 0.60) {
                categoryId = suggestRes.category_id;
                mappingSource = 'openai';
              }
            }
          } catch (e) {
            console.error('Error suggesting category via OpenAI:', e);
          }
        }
      }

      // Fallback final: Garantir que o ID da categoria NUNCA fique em branco
      if (!categoryId && userCategories.length > 0) {
        const typeCategories = userCategories.filter(c => c.type === tx.type);
        if (typeCategories.length > 0) {
          // Tentar achar "Outros" ou "Outras receitas"
          const fallbackName = tx.type === 'income' ? 'outras receitas' : 'outros';
          const foundFallback = typeCategories.find(c => c.name.toLowerCase() === fallbackName);
          if (foundFallback) {
            categoryId = foundFallback.id;
            mappingSource = 'fallback_name';
          } else {
            // Pegar a primeira categoria disponível do tipo correspondente
            categoryId = typeCategories[0].id;
            mappingSource = 'fallback_first';
          }
        }
      }

      // Montar objeto de transação final compatível com ImportRow do frontend
      processedTransactions.push({
        id: Math.random().toString(36).substr(2, 9),
        date: tx.date,
        description: tx.description,
        amount: Number(tx.amount) || 0,
        type: tx.type,
        categoryId: categoryId || '',
        suggestedType: tx.type,
        originalSign: tx.type === 'expense' ? '-' : '+',
        isPaid: true,
        paidDate: tx.date,
        mappingSource
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ transactions: processedTransactions }));

  } catch (error: any) {
    console.error('Error processing PDF extract:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}
