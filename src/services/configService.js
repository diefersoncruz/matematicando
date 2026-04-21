import { supabase } from './supabase.js';

export const configService = {
  // Get configuration for a specific room
  async getRoomConfig(salaId) {
    try {
      const { data, error } = await supabase
        .rpc('get_room_configuration', { p_sala_id: salaId });

      if (error) throw error;

      // Transform database format to match expected format
      return {
        limiteTempo: data[0]?.limite_tempo || 60,
        limiteFatorA: data[0]?.limite_fator_a || 10,
        limiteNegativoFatorA: data[0]?.limite_negativo_fator_a || 0,
        limiteFatorB: data[0]?.limite_fator_b || 10,
        limiteNegativoFatorB: data[0]?.limite_negativo_fator_b || 0,
        operacoesPermitidas: {
          operacoesDeDivisao: data[0]?.operacoes_divisao || true,
          operacoesDeMultiplicacao: data[0]?.operacoes_multiplicacao || true,
          operacoesDeAdicao: data[0]?.operacoes_adicao || true,
          operacoesDeSubtracao: data[0]?.operacoes_subtracao || true,
        },
        exibicao: {
          exibirRespostaCerta: data[0]?.exibir_resposta_certa || false,
        },
      };
    } catch (error) {
      console.error('Error fetching room configuration:', error);
      // Return default configuration if error occurs
      return {
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
    }
  },

  // Save configuration for a specific room
  async saveRoomConfig(salaId, config) {
    try {
      const { data, error } = await supabase
        .rpc('save_room_configuration', {
          p_sala_id: salaId,
          p_limite_tempo: config.limiteTempo || 60,
          p_limite_fator_a: config.limiteFatorA || 10,
          p_limite_fator_b: config.limiteFatorB || 10,
          p_limite_negativo_fator_a: config.limiteNegativoFatorA || 0,
          p_limite_negativo_fator_b: config.limiteNegativoFatorB || 0,
          p_operacoes_adicao: config.operacoesPermitidas?.operacoesDeAdicao || true,
          p_operacoes_subtracao: config.operacoesPermitidas?.operacoesDeSubtracao || true,
          p_operacoes_multiplicacao: config.operacoesPermitidas?.operacoesDeMultiplicacao || true,
          p_operacoes_divisao: config.operacoesPermitidas?.operacoesDeDivisao || true,
          p_exibir_resposta_certa: config.exibicao?.exibirRespostaCerta || false,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving room configuration:', error);
      throw error;
    }
  }
};
