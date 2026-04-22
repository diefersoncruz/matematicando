import { supabase, handleSupabaseError } from './supabase.js';

export const roomConfigurationService = {
  // Get room configuration
  async getRoomConfiguration(salaId) {
    try {
      const { data, error } = await supabase
        .from('room_configurations')
        .select('*')
        .eq('sala_id', salaId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Return default configuration if none exists
      if (!data) {
        return this.getDefaultConfiguration();
      }

      return this.formatConfiguration(data);
    } catch (error) {
      console.error('Error fetching room configuration:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Save room configuration
  async saveRoomConfiguration(salaId, configuration) {
    try {
      console.log('=== roomConfigurationService.saveRoomConfiguration Debug ===');
      console.log('Sala ID:', salaId);
      console.log('Configuration received:', configuration);
      
      // Handle both direct flags and nested structure
      const operacoesAdicao = configuration.operacoesPermitidas?.operacoesDeAdicao ?? configuration.operacoesAdicao ?? true;
      const operacoesSubtracao = configuration.operacoesPermitidas?.operacoesDeSubtracao ?? configuration.operacoesSubtracao ?? true;
      const operacoesMultiplicacao = configuration.operacoesPermitidas?.operacoesDeMultiplicacao ?? configuration.operacoesMultiplicacao ?? true;
      const operacoesDivisao = configuration.operacoesPermitidas?.operacoesDeDivisao ?? configuration.operacoesDivisao ?? true;
      const exibirRespostaCerta = configuration.exibicao?.exibirRespostaCerta ?? configuration.exibirRespostaCerta ?? false;
      
      const upsertData = {
        sala_id: salaId,
        limite_tempo: configuration.limiteTempo || 60,
        limite_fator_a: configuration.limiteFatorA || 10,
        limite_fator_b: configuration.limiteFatorB || 10,
        limite_negativo_fator_a: configuration.limiteNegativoFatorA || 0,
        limite_negativo_fator_b: configuration.limiteNegativoFatorB || 0,
        operacoes_adicao: operacoesAdicao,
        operacoes_subtracao: operacoesSubtracao,
        operacoes_multiplicacao: operacoesMultiplicacao,
        operacoes_divisao: operacoesDivisao,
        exibir_resposta_certa: exibirRespostaCerta
      };
      
      console.log('Data to upsert:', upsertData);
      console.log('Processed flag values:', {
        operacoesAdicao,
        operacoesSubtracao,
        operacoesMultiplicacao,
        operacoesDivisao,
        exibirRespostaCerta
      });
      console.log('Original configuration structure:', {
        hasOperacoesPermitidas: !!configuration.operacoesPermitidas,
        hasExibicao: !!configuration.exibicao,
        operacoesPermitidas: configuration.operacoesPermitidas,
        exibicao: configuration.exibicao
      });
      
      const { data, error } = await supabase
        .from('room_configurations')
        .upsert(upsertData, {
          onConflict: 'sala_id'
        })
        .select()
        .single();

      if (error) throw error;
      return this.formatConfiguration(data);
    } catch (error) {
      console.error('Error saving room configuration:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Delete room configuration
  async deleteRoomConfiguration(salaId) {
    try {
      const { error } = await supabase
        .from('room_configurations')
        .delete()
        .eq('sala_id', salaId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting room configuration:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Format configuration for frontend
  formatConfiguration(dbConfig) {
    return {
      limiteTempo: dbConfig.limite_tempo,
      limiteFatorA: dbConfig.limite_fator_a,
      limiteFatorB: dbConfig.limite_fator_b,
      limiteNegativoFatorA: dbConfig.limite_negativo_fator_a,
      limiteNegativoFatorB: dbConfig.limite_negativo_fator_b,
      operacoesPermitidas: {
        operacoesDeAdicao: dbConfig.operacoes_adicao,
        operacoesDeSubtracao: dbConfig.operacoes_subtracao,
        operacoesDeMultiplicacao: dbConfig.operacoes_multiplicacao,
        operacoesDeDivisao: dbConfig.operacoes_divisao
      },
      exibicao: {
        exibirRespostaCerta: dbConfig.exibir_resposta_certa
      }
    };
  },

  // Get default configuration
  getDefaultConfiguration() {
    return {
      limiteTempo: 60,
      limiteFatorA: 10,
      limiteFatorB: 10,
      limiteNegativoFatorA: 0,
      limiteNegativoFatorB: 0,
      operacoesPermitidas: {
        operacoesDeAdicao: true,
        operacoesDeSubtracao: true,
        operacoesDeMultiplicacao: true,
        operacoesDeDivisao: true
      },
      exibicao: {
        exibirRespostaCerta: false
      }
    };
  },

  // Validate configuration
  validateConfiguration(configuration) {
    const errors = [];

    if (configuration.limiteTempo && (configuration.limiteTempo < 10 || configuration.limiteTempo > 300)) {
      errors.push('O tempo limite deve estar entre 10 e 300 segundos');
    }

    if (configuration.limiteFatorA !== undefined && (configuration.limiteFatorA < 1 || configuration.limiteFatorA > 1000)) {
      errors.push('O limite do fator A deve ser um número positivo entre 1 e 1000');
    }

    if (configuration.limiteFatorB !== undefined && (configuration.limiteFatorB < 1 || configuration.limiteFatorB > 1000)) {
      errors.push('O limite do fator B deve ser um número positivo entre 1 e 1000');
    }

    if (configuration.limiteNegativoFatorA !== undefined && (configuration.limiteNegativoFatorA < -1000 || configuration.limiteNegativoFatorA > 0)) {
      errors.push('O limite negativo do fator A deve ser um número negativo ou zero entre -1000 e 0');
    }

    if (configuration.limiteNegativoFatorB !== undefined && (configuration.limiteNegativoFatorB < -1000 || configuration.limiteNegativoFatorB > 0)) {
      errors.push('O limite negativo do fator B deve ser um número negativo ou zero entre -1000 e 0');
    }

    // Check if at least one operation is enabled
    const operations = configuration.operacoesPermitidas || {};
    const hasOperation = Object.values(operations).some(enabled => enabled);
    if (!hasOperation) {
      errors.push('Pelo menos uma operação deve ser permitida');
    }

    return errors;
  }
};
