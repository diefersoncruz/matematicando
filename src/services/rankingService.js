import { supabase, handleSupabaseError } from './supabase.js';

export const rankingService = {
  // Get ranking for a specific sala
  async getSalaRanking(salaId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select('*')
        .eq('sala_id', salaId)
        .order('hits', { ascending: false })
        .order('errors', { ascending: true })
        .order('total_time_seconds', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Add position numbers and format data
      const rankingWithPositions = data.map((score, index) => ({
        ...score,
        rank_position: index + 1,
        name: score.player_name || 'Jogador Anônimo',
        score: score.hits || 0, // Usar hits como score principal
        hits: score.hits || 0,
        errors: score.errors || 0,
        total_time_seconds: score.total_time_seconds || 0
      }));
      
      return rankingWithPositions;
    } catch (error) {
      console.error('Error fetching sala ranking:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get top players across all salas
  async getTopPlayers(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select(`
          *,
          salas: sala_id (
            nome,
            tipo
          )
        `)
        .order('hits', { ascending: false })
        .order('accuracy', { ascending: false })
        .order('total_time_seconds', { ascending: true })
        .limit(limit);

      if (error) throw error;
      
      // Add position numbers
      const topPlayersWithPositions = data.map((player, index) => ({
        ...player,
        rank_position: index + 1
      }));
      
      return topPlayersWithPositions;
    } catch (error) {
      console.error('Error fetching top players:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Save or update a player's score
  async savePlayerScore(salaId, playerName, hits, errors, totalTimeSeconds) {
    try {
      console.log('=== savePlayerScore Debug ===');
      console.log('Parâmetros:', { salaId, playerName, hits, errors, totalTimeSeconds });
      
      // First check if player already has a score in this sala
      const { data: existingScore, error: fetchError } = await supabase
        .from('game_scores')
        .select('*')
        .eq('sala_id', salaId)
        .eq('player_name', playerName)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      console.log('Score existente:', existingScore);
      console.log('Fetch error:', fetchError);

      let result;
      
      if (existingScore) {
        console.log('Comparando scores:');
        console.log('Existente - hits:', existingScore.hits, 'errors:', existingScore.errors, 'tempo:', existingScore.total_time_seconds);
        console.log('Novo     - hits:', hits, 'errors:', errors, 'tempo:', totalTimeSeconds);
        
        // Update existing score only if it's better
        const isNewScoreBetter = hits > existingScore.hits || 
            (hits === existingScore.hits && errors < existingScore.errors) ||
            (hits === existingScore.hits && errors === existingScore.errors && totalTimeSeconds < existingScore.total_time_seconds);
        
        console.log('Novo score é melhor?', isNewScoreBetter);
        
        if (isNewScoreBetter) {
          console.log('Atualizando score existente...');
          const { data, error } = await supabase
            .from('game_scores')
            .update({
              hits: hits,
              errors: errors,
              total_time_seconds: totalTimeSeconds,
              game_date: new Date().toISOString()
            })
            .eq('id', existingScore.id)
            .select()
            .single();

          if (error) throw error;
          result = data;
          console.log('Score atualizado:', result);
        } else {
          // Keep existing score if it's better
          console.log('Mantendo score existente (é melhor)');
          result = existingScore;
        }
      } else {
        console.log('Inserindo novo score...');
        // Insert new score
        const { data, error } = await supabase
          .from('game_scores')
          .insert({
            sala_id: salaId,
            player_name: playerName,
            hits: hits,
            errors: errors,
            total_time_seconds: totalTimeSeconds
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
        console.log('Novo score inserido:', result);
      }

      return result;
    } catch (error) {
      console.error('Error saving player score:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get player's best scores across all salas
  async getPlayerScores(playerName, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select(`
          *,
          salas: sala_id (
            nome,
            tipo
          )
        `)
        .eq('player_name', playerName)
        .order('hits', { ascending: false })
        .order('accuracy', { ascending: false })
        .order('game_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching player scores:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get sala statistics
  async getSalaStats(salaId) {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select('hits, errors, total_time_seconds, player_name, game_date')
        .eq('sala_id', salaId);

      if (error) throw error;

      const totalPlayers = new Set(data.map(score => score.player_name)).size;
      const totalHits = data.reduce((sum, score) => sum + score.hits, 0);
      const totalErrors = data.reduce((sum, score) => sum + score.errors, 0);
      const avgAccuracy = data.length > 0 
        ? (data.reduce((sum, score) => sum + score.accuracy, 0) / data.length).toFixed(2)
        : 0;
      const avgTime = data.length > 0
        ? Math.round(data.reduce((sum, score) => sum + score.total_time_seconds, 0) / data.length)
        : 0;

      return {
        totalPlayers,
        totalGames: data.length,
        totalHits,
        totalErrors,
        avgAccuracy: parseFloat(avgAccuracy),
        avgTime
      };
    } catch (error) {
      console.error('Error fetching sala stats:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Delete a score (for admin purposes)
  async deleteScore(scoreId) {
    try {
      const { error } = await supabase
        .from('game_scores')
        .delete()
        .eq('id', scoreId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting score:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get ranking history for a sala
  async getSalaHistory(salaId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('game_scores')
        .select('*')
        .eq('sala_id', salaId)
        .gte('game_date', startDate.toISOString())
        .order('game_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching sala history:', error);
      throw new Error(handleSupabaseError(error));
    }
  }
};
