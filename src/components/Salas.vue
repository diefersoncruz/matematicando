<template>
  <div class="salas-container">
    <h2>Minhas Salas</h2>
    <ul v-if="salas.data">
      <li v-for="sala in salas" :key="sala.id">
        <span class="sala-nome">{{ sala.nome }}</span>
        <span class="sala-data">
          Expira em: {{ formatarData(sala.dataExpiracao) }}
        </span>
        <button @click="editarSala(sala.id)">Editar</button>
      </li>
    </ul>
    <p v-else>Você não possui nenhuma sala.</p>
  </div>
</template>

<script>
import Salas from "@/data/Salas.js";
import "@/assets/css/Salas.css";

export default {
  extends: Salas,
  methods: {
    formatarData(data) {
      const dataFormatada = new Date(data);
      return dataFormatada.toLocaleDateString("pt-BR"); // Formato: DD/MM/YYYY
    },
  },
};
console.log(Salas);
</script>
