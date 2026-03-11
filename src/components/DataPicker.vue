<template>
  <input type="date" v-model="formattedDate" />
</template>

<script>
export default {
  name: "DatePicker",
  props: {
    value: {
      type: Date,
      required: false,
    },
  },
  computed: {
    formattedDate: {
      get() {
        return this.value ? this.formatDate(this.value) : null;
      },
      set(dateString) {
        this.$emit("input", new Date(dateString));
      },
    },
  },
  methods: {
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
  },
};
</script>
