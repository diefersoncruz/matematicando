<template>
  <div class="sala-form-container">
    <h2>Criar/Editar Sala</h2>
    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="nomeSala">Nome da Sala *</label>
        <input type="text" id="nomeSala" v-model="sala.nome" required />
        <span class="error-message" v-if="errors.nome">{{ errors.nome }}</span>
      </div>

      <div class="form-group">
        <label for="dataExpiracao">Data de Expiração</label>
        <date-picker v-model="sala.dataExpiracao"></date-picker>
      </div>

      <div class="button-group">
        <button type="submit" :disabled="submitting">Salvar</button>
        <button type="button" @click="cancel">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script src="@/data/SalaForm.js"></script>
<style scoped src="@/assets/css/SalaForm.css"></style>
