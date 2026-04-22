import { getRandomInt } from "./utils.js";
import { configService } from "./configService.js";

let configuracoes = {
  limiteTempo: 60,
  limiteFatorA: 10,
  limiteNegativoFatorA: 0,
  limiteFatorB: 10,
  limiteNegativoFatorB: 0,
  operacoesPermitidas: {
    operacoesDeDivisao: true,
    operacoesDeMultiplicacao: true,
    operacoesDeAdicao: true,
    operacoesDeSubtracao: true,
  },
  exibicao: {
    exibirRespostaCerta: false,
  },
};

const operacoes = {
  1: {
    simbolo: "÷",
    funcao: (a, b) => a / b,
    habilitado: configuracoes.operacoesPermitidas.operacoesDeDivisao,
  },
  2: {
    simbolo: "X",
    funcao: (a, b) => a * b,
    habilitado: configuracoes.operacoesPermitidas.operacoesDeMultiplicacao,
  },
  3: {
    simbolo: "+",
    funcao: (a, b) => a + b,
    habilitado: configuracoes.operacoesPermitidas.operacoesDeAdicao,
  },
  4: {
    simbolo: "-",
    funcao: (a, b) => a - b,
    habilitado: configuracoes.operacoesPermitidas.operacoesDeSubtracao,
  },
};

let historicoOperacoes = [];
let operadorMatematicoAtual;
let operationSet = new Set(); // Global Set for O(1) lookup

async function loadConfig(salaId = null) {
  console.log('loadConfig chamado com salaId:', salaId);
  if (salaId) {
    console.log('Carregando configurações para a sala:', salaId);
    configuracoes = await configService.getRoomConfig(salaId);
    console.log('Configurações carregadas:', configuracoes);
    // Update operations enabled status
    operacoes[1].habilitado = configuracoes.operacoesPermitidas.operacoesDeDivisao;
    operacoes[2].habilitado = configuracoes.operacoesPermitidas.operacoesDeMultiplicacao;
    operacoes[3].habilitado = configuracoes.operacoesPermitidas.operacoesDeAdicao;
    operacoes[4].habilitado = configuracoes.operacoesPermitidas.operacoesDeSubtracao;
    console.log('Operações atualizadas:', operacoes);
  } else {
    console.log('Nenhum salaId fornecido, usando configurações padrão');
  }
}

function gerarOperacao(atualizarDados) {
  const operacoesHabilitadas = Object.keys(operacoes).filter(
    (op) => operacoes[op].habilitado
  );

  if (operacoesHabilitadas.length === 0) {
    console.error("Nenhuma operação habilitada nas configurações!");
    return;
  }

  let operadorValido = false;
  let fator1, fator2;
  let tentativas = 0;
  const maxTentativas = 50; // Limitar tentativas para evitar loops infinitos

  do {
    operadorMatematicoAtual = parseInt(
      operacoesHabilitadas[getRandomInt(0, operacoesHabilitadas.length - 1)]
    );

    [fator1, fator2] = gerarFatores(operadorMatematicoAtual);
    operadorValido = !operacaoRepetida(fator1, fator2, operadorMatematicoAtual);
    tentativas++;
    
    // Se não encontrar após muitas tentativas, permite repetição
    if (tentativas >= maxTentativas) {
      console.log('Máximo de tentativas atingido, permitindo operação repetida');
      operadorValido = true;
    }
  } while (!operadorValido);

  const operationKey = `${fator1},${fator2},${operadorMatematicoAtual}`;
  
  historicoOperacoes.push({
    fator1,
    fator2,
    operador: operadorMatematicoAtual,
  });
  
  // Update Set for O(1) lookup
  operationSet.add(operationKey);
  
  // Limit history size to prevent memory leak and performance degradation
  if (historicoOperacoes.length > 100) {
    const removed = historicoOperacoes.shift(); // Remove oldest operation
    const removedKey = `${removed.fator1},${removed.fator2},${removed.operador}`;
    operationSet.delete(removedKey);
    console.log('Historico limitado a 100 operações, removendo mais antiga');
  }

  atualizarDados("fator1", fator1);
  atualizarDados("fator2", fator2);
  atualizarDados("operador", operacoes[operadorMatematicoAtual].simbolo);
  atualizarDados("respostaUsuario", "");
}

function gerarFatores(operador) {
  let fator1, fator2;
  console.log('=== gerarFatores Debug ===');
  console.log('Operador:', operador);
  console.log('Configurações atuais:', configuracoes);
  console.log('limiteNegativoFatorA:', configuracoes.limiteNegativoFatorA);
  console.log('limiteFatorA:', configuracoes.limiteFatorA);
  console.log('limiteNegativoFatorB:', configuracoes.limiteNegativoFatorB);
  console.log('limiteFatorB:', configuracoes.limiteFatorB);
  
  // Verificar se os limites permitem números negativos
  const permiteNegativosA = configuracoes.limiteNegativoFatorA < 0;
  const permiteNegativosB = configuracoes.limiteNegativoFatorB < 0;
  console.log('Permite negativos A:', permiteNegativosA);
  console.log('Permite negativos B:', permiteNegativosB);
  
  do {
    fator1 = getRandomInt(
      configuracoes.limiteNegativoFatorA,
      configuracoes.limiteFatorA
    );
    fator2 = getRandomInt(
      configuracoes.limiteNegativoFatorB,
      configuracoes.limiteFatorB
    );
    
    console.log('Fatores gerados:', { fator1, fator2 });

    if (operador === 1 && fator2 !== 0) {
      fator1 =
        fator2 *
        Math.round(
          getRandomInt(
            configuracoes.limiteNegativoFatorA / fator2,
            configuracoes.limiteFatorA / fator2
          )
        );
    }
  } while (fator1 === 0 || fator2 === 0);

  return [fator1, fator2];
}

function operacaoRepetida(fator1, fator2, operador) {
  // Create a unique key for faster comparison
  const operationKey = `${fator1},${fator2},${operador}`;
  
  // Use Set for O(1) lookup instead of Array.some() O(n)
  return operationSet.has(operationKey);
}

function validarResultado(atualizarDados) {
  const fator1 = parseFloat(atualizarDados("fator1"));
  const fator2 = parseFloat(atualizarDados("fator2"));
  const respostaUsuario = parseFloat(atualizarDados("respostaUsuario"));
  
  const resultadoCorreto = operacoes[operadorMatematicoAtual].funcao(fator1, fator2);
  
  if (resultadoCorreto === respostaUsuario) {
    adicionarAcerto(atualizarDados);
    gerarOperacao(atualizarDados);
  } else {
    adicionarErro(atualizarDados);
    if (configuracoes.exibicao.exibirRespostaCerta) {
      alert(`Resposta correta: ${resultadoCorreto}`);
    }
    gerarOperacao(atualizarDados);
  }
}

function adicionarErro(atualizarDados) {
  atualizarDados("erros", parseInt(atualizarDados("erros")) + 1);
}

function adicionarAcerto(atualizarDados) {
  atualizarDados("acertos", parseInt(atualizarDados("acertos")) + 1);
}

function zerarPontuacao(atualizarDados) {
  atualizarDados("acertos", 0);
  atualizarDados("erros", 0);
}

function limparHistorico() {
  historicoOperacoes = [];
  operationSet = new Set(); // Reset the Set for O(1) lookup
  console.log('Histórico de operações limpo');
}

function getConfig() {
  return configuracoes;
}

export { gerarOperacao, validarResultado, zerarPontuacao, limparHistorico, loadConfig, getConfig, operacoes, operadorMatematicoAtual };
