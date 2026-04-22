-- ========================================
-- SCRIPT DE LIMPEZA COMPLETA DA BASE DE DADOS
-- Matematicando - Sistema de Jogo Matemático
-- ========================================
-- 
-- ATENÇÃO: Este script irá APAGAR TODOS os dados da base de dados!
-- Execute apenas se tiver certeza do que está fazendo.
-- 
-- Autor: Cascade AI Assistant
-- Data: 2026-04-21
-- ========================================

-- Iniciar transação para garantir que tudo seja revertido em caso de erro
BEGIN;

-- Exibir mensagem de confirmação (opcional, dependendo do cliente SQL)
-- SELECT 'ATENÇÃO: Este script irá apagar TODOS os dados da base de dados!' as message;
-- SELECT 'Pressione Ctrl+C para cancelar ou Enter para continuar...' as message;

-- ========================================
-- LIMPEZA DE TABELAS (ORDEM CORRETA PARA EVITAR VIOLAÇÃO DE FK)
-- ========================================

-- 1. Limpar scores do jogo (game_scores)
-- Tabela: game_scores - Armazena pontuações dos jogadores
TRUNCATE TABLE game_scores RESTART IDENTITY CASCADE;

-- 2. Limpar configurações das salas (room_configurations)
-- Tabela: room_configurations - Armazena configurações personalizadas das salas
TRUNCATE TABLE room_configurations RESTART IDENTITY CASCADE;

-- 3. Limpar associações de usuários com salas (user_rooms)
-- Tabela: user_rooms - Associações entre usuários e salas
TRUNCATE TABLE user_rooms RESTART IDENTITY CASCADE;

-- 4. Limpar salas (salas)
-- Tabela: salas - Informações das salas criadas
TRUNCATE TABLE salas RESTART IDENTITY CASCADE;

-- 5. Limpar perfis de usuários (profiles) - se existir
-- Tabela: profiles - Perfis adicionais dos usuários (opcional)
-- DELETE FROM profiles;

-- ========================================
-- OBSERVAÇÃO IMPORTANTE
-- ========================================
-- 
-- TRUNCATE com RESTART IDENTITY CASCADE já resetou automaticamente:
-- - Todos os dados das tabelas
-- - As sequências auto-increment (ID = 1, 2, 3...)
-- - As chaves estrangeiras foram respeitadas com CASCADE
-- 
-- Não é necessário reset manual de sequências!

-- ========================================
-- VERIFICAÇÃO DE LIMPEZA
-- ========================================

-- Verificar se as tabelas estão vazias
SELECT 'Verificando limpeza das tabelas...' as status;

SELECT 
  'game_scores' as tabela,
  COUNT(*) as registros_restantes
FROM game_scores
UNION ALL
SELECT 
  'room_configurations' as tabela,
  COUNT(*) as registros_restantes
FROM room_configurations
UNION ALL
SELECT 
  'user_rooms' as tabela,
  COUNT(*) as registros_restantes
FROM user_rooms
UNION ALL
SELECT 
  'salas' as tabela,
  COUNT(*) as registros_restantes
FROM salas;

-- ========================================
-- CONFIRMAÇÃO FINAL
-- ========================================

-- Confirmar que todas as tabelas principais estão vazias
SELECT 
  CASE 
    WHEN (
      (SELECT COUNT(*) FROM game_scores) = 0 AND
      (SELECT COUNT(*) FROM room_configurations) = 0 AND
      (SELECT COUNT(*) FROM user_rooms) = 0 AND
      (SELECT COUNT(*) FROM salas) = 0
    ) 
    THEN 'SUCESSO: Todas as tabelas foram limpas!'
    ELSE 'ERRO: Algumas tabelas ainda contêm dados!'
  END as status_final;

-- Commit da transação
COMMIT;

-- ========================================
-- INSTRUÇÕES ADICIONAIS
-- ========================================

-- Para Supabase, você pode executar este script através do:
-- 1. Supabase Dashboard > SQL Editor
-- 2. CLI: supabase db reset
-- 3. API: POST /rest/v1/rpc/exec com o script

-- Alternativa completa para Supabase (reset total):
-- supabase db reset

-- Para reiniciar apenas dados (preservar estrutura):
-- 1. Execute este script SQL
-- 2. Limpe cache do aplicativo
-- 3. Faça login novamente para criar novos dados

-- ========================================
-- ESTRUTURA DAS TABELAS LIMPADAS
-- ========================================

/*
Estrutura esperada das tabelas após limpeza:

1. game_scores
   - id (bigint, primary key)
   - sala_id (uuid, foreign key)
   - player_name (text)
   - hits (integer)
   - errors (integer)
   - total_time_seconds (integer)
   - game_date (timestamp)
   - created_at (timestamp)
   - updated_at (timestamp)

2. room_configurations
   - id (bigint, primary key)
   - sala_id (uuid, foreign key, unique)
   - limiteTempo (integer)
   - limiteFatorA (integer)
   - limiteFatorB (integer)
   - permiteNegativosA (boolean)
   - permiteNegativosB (boolean)
   - operacoesPermitidas (text[])
   - created_at (timestamp)
   - updated_at (timestamp)

3. user_rooms
   - id (bigint, primary key)
   - user_id (uuid, foreign key)
   - sala_id (uuid, foreign key)
   - role (text)
   - is_active (boolean)
   - joined_at (timestamp)
   - last_accessed (timestamp)

4. salas
   - id (uuid, primary key)
   - nome (text)
   - descricao (text)
   - tipo (text)
   - data_expiracao (date)
   - capacidade (integer)
   - created_by (uuid, foreign key)
   - created_at (timestamp)
   - updated_at (timestamp)
*/
