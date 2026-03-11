import axios from "axios";
export default {
  name: "Salas",
  data() {
    return {
      salas: [],
      userId: 1, // Substituir pelo ID do usuário logado
    };
  },
  mounted() {
    this.fetchSalas();
  },
  methods: {
    fetchSalas() {
      axios
        .get(`/api/salas/usuario/${this.userId}`)
        .then((response) => {
          this.salas = response.data;
        })
        .catch((error) => {
          console.error("Erro ao obter salas:", error);
        });
    },
    editarSala(salaId) {
      this.$router.push(`/salas/editar/${salaId}`);
    },
  },
};
