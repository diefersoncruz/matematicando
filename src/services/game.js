import { getRandomInt } from "./utils.js";
import { configuracoes } from "../data/config.js";

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

  do {
    operadorMatematicoAtual = parseInt(
      operacoesHabilitadas[getRandomInt(0, operacoesHabilitadas.length - 1)]
    );

    [fator1, fator2] = gerarFatores(operadorMatematicoAtual);
    operadorValido = !operacaoRepetida(fator1, fator2, operadorMatematicoAtual);
  } while (!operadorValido);

  historicoOperacoes.push({
    fator1,
    fator2,
    operador: operadorMatematicoAtual,
  });

  atualizarDados("fator1", fator1);
  atualizarDados("fator2", fator2);
  atualizarDados("operador", operacoes[operadorMatematicoAtual].simbolo);
  atualizarDados("respostaUsuario", "");
}

function gerarFatores(operador) {
  let fator1, fator2;
  do {
    fator1 = getRandomInt(
      configuracoes.limiteNegativoFatorA,
      configuracoes.limiteFatorA
    );
    fator2 = getRandomInt(
      configuracoes.limiteNegativoFatorB,
      configuracoes.limiteFatorB
    );

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
  return historicoOperacoes.some(
    (op) =>
      op.fator1 === fator1 && op.fator2 === fator2 && op.operador === operador
  );
}

function validarResultado(atualizarDados) {
  const resultadoCorreto = operacoes[operadorMatematicoAtual].funcao(
    parseFloat(atualizarDados("fator1")),
    parseFloat(atualizarDados("fator2"))
  );
  if (resultadoCorreto === parseFloat(atualizarDados("respostaUsuario"))) {
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

export { gerarOperacao, validarResultado, zerarPontuacao };
