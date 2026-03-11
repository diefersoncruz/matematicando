import DatePicker from "../components/DataPicker.vue";

export default {
  name: "SalaForm",
  components: {
    DatePicker,
  },

  data() {
    return {
      sala: {
        nome: "",
        dataExpiracao: null,
      },
      errors: {
        nome: null,
      },
      submitting: false, // Flag para controlar o estado de submissão
    };
  },

  methods: {
    submitForm() {
      this.errors = {}; // Limpa erros anteriores
      this.submitting = true; // Define o estado de submissão como true

      if (!this.sala.nome) {
        this.errors.nome = "O nome da sala é obrigatório";
        this.submitting = false;
        return;
      }

      // Simula uma chamada à API (substitua pela sua lógica real)
      setTimeout(() => {
        console.log("Dados enviados:", this.sala);
        // Após a submissão bem-sucedida:
        this.submitting = false;
        this.$router.push("/lista-salas"); // Navegação após o submit
      }, 1000);
    },

    cancel() {
      this.$router.push("/lista-salas"); // Lógica para cancelar, redireciona para a página principal
    },
  },
};
