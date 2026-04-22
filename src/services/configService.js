import { supabase } from './supabase.js';

export const configService = {
  // Get configuration for a specific room
  async getRoomConfig(salaId) {
    console.log('configService.getRoomConfig chamado com salaId:', salaId);
    try {
      // Try direct table query first
      console.log('Tentando consulta direta à tabela room_configurations...');
      const { data: tableData, error: tableError } = await supabase
        .from('room_configurations')
        .select('*')
        .eq('sala_id', salaId);

      console.log('Consulta direta - data:', tableData, 'error:', tableError);

      if (!tableError && tableData && tableData.length > 0) {
        console.log('Usando dados da consulta direta');
        const config = {
          limiteTempo: tableData[0].limite_tempo || 60,
          limiteFatorA: tableData[0].limite_fator_a || 10,
          limiteNegativoFatorA: tableData[0].limite_negativo_fator_a || 0,
          limiteFatorB: tableData[0].limite_fator_b || 10,
          limiteNegativoFatorB: tableData[0].limite_negativo_fator_b || 0,
          operacoesPermitidas: {
            operacoesDeDivisao: tableData[0].operacoes_divisao ?? true,
            operacoesDeMultiplicacao: tableData[0].operacoes_multiplicacao ?? true,
            operacoesDeAdicao: tableData[0].operacoes_adicao ?? true,
            operacoesDeSubtracao: tableData[0].operacoes_subtracao ?? true,
          },
          exibicao: {
            exibirRespostaCerta: tableData[0].exibir_resposta_certa || false,
          },
        };
        
        console.log('Configurações da tabela:', config);
        return config;
      }

      // Define default configuration once to use in multiple places
      const defaultConfig = {
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

      // First verify if the room exists
      console.log('Verificando se a sala existe:', salaId);
      const { data: roomExists, error: roomCheckError } = await supabase
        .from('salas')
        .select('id')
        .eq('id', salaId)
        .single();

      if (roomCheckError || !roomExists) {
        console.error('Sala não encontrada, retornando configuração padrão:', roomCheckError);
        return defaultConfig;
      }

      // If no configuration exists, create default configuration for this room
      if (!tableError && (!tableData || tableData.length === 0)) {
        console.log('Nenhuma configuração encontrada, criando configuração padrão para a sala:', salaId);
        try {
          await this.saveRoomConfig(salaId, defaultConfig);
          console.log('Configuração padrão criada com sucesso');
          return defaultConfig;
        } catch (saveError) {
          console.error('Erro ao criar configuração padrão:', saveError);
          // Return default config even if save fails
          return defaultConfig;
        }
      }

      // Fallback to RPC function
      console.log('Tentando função RPC get_room_configuration...');
      const { data, error } = await supabase
        .rpc('get_room_configuration', { p_sala_id: salaId });

      console.log('Resposta do RPC - data:', data, 'error:', error);

      if (error) throw error;

      // Transform database format to match expected format
      const config = {
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
      
      console.log('Configurações do RPC:', config);
      return config;
    } catch (error) {
      console.error('Error fetching room configuration:', error);
      // Return default configuration if error occurs
      const defaultConfig = {
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
      console.log('Retornando configuração padrão devido a erro:', defaultConfig);
      return defaultConfig;
    }
  },

  // Save configuration for a specific room
  async saveRoomConfig(salaId, config) {
    try {
      console.log('=== saveRoomConfig Debug ===');
      console.log('Config received:', config);
      
      // Handle both direct flags and nested structure
      const operacoesAdicao = config.operacoesPermitidas?.operacoesDeAdicao ?? config.operacoesDeAdicao ?? true;
      const operacoesSubtracao = config.operacoesPermitidas?.operacoesDeSubtracao ?? config.operacoesDeSubtracao ?? true;
      const operacoesMultiplicacao = config.operacoesPermitidas?.operacoesDeMultiplicacao ?? config.operacoesMultiplicacao ?? true;
      const operacoesDivisao = config.operacoesPermitidas?.operacoesDeDivisao ?? config.operacoesDeDivisao ?? true;
      const exibirRespostaCerta = config.exibicao?.exibirRespostaCerta ?? config.exibirRespostaCerta ?? false;
      
      console.log('Processed flags:', {
        operacoesAdicao,
        operacoesSubtracao, 
        operacoesMultiplicacao,
        operacoesDivisao,
        exibirRespostaCerta
      });
      
      const { data, error } = await supabase
        .rpc('save_room_configuration', {
          p_sala_id: salaId,
          p_limite_tempo: config.limiteTempo || 60,
          p_limite_fator_a: config.limiteFatorA || 10,
          p_limite_fator_b: config.limiteFatorB || 10,
          p_limite_negativo_fator_a: config.limiteNegativoFatorA || 0,
          p_limite_negativo_fator_b: config.limiteNegativoFatorB || 0,
          p_operacoes_adicao: operacoesAdicao,
          p_operacoes_subtracao: operacoesSubtracao,
          p_operacoes_multiplicacao: operacoesMultiplicacao,
          p_operacoes_divisao: operacoesDivisao,
          p_exibir_resposta_certa: exibirRespostaCerta,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving room configuration:', error);
      // Define default config here as well for error cases
      const fallbackConfig = {
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
      
      console.log('Retornando configuração padrão devido a erro:', fallbackConfig);
      return fallbackConfig;
    }
  }
};
