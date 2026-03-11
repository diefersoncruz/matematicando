# Use a imagem oficial do Node.js
FROM node:18

# Define o diretório de trabalho dentro do contêiner
WORKDIR /matematicando-web

# Copia o package.json e package-lock.json PRIMEIRO
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o resto do código da aplicação DEPOIS das dependências
COPY . .

# Compile a aplicação
RUN npm run build

# Define a porta que a aplicação vai usar
EXPOSE 5481

# Comando para iniciar o servidor
CMD ["npx", "serve", "-s", "dist", "-l", "5481"]