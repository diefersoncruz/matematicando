<template>
  <h1 class="title">Sala atual: 1b</h1>
  <el-table
    :data="tableData"
    style="width: 100%"
    height="100%"
    :row-class-name="tableRowClassName"
  >
    <el-table-column prop="position" label="Pos." width="50" />
    <el-table-column prop="name" label="Nome" width="170" />
    <el-table-column prop="hits" label="Acertos" width="80" />
  </el-table>
</template>

<script setup>
import { ref } from "vue";

const tableData = ref([{ position: 1, name: "João", hits: 10 }]);
</script>

<style scoped>
.title {
  text-align: center;
  border: 1rem solid;
  border-color: transparent;
}
</style>
