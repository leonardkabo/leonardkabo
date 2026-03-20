# Étape de construction (Build)
FROM node:22-alpine AS build

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code source et construction du frontend (Vite)
COPY . .
RUN npm run build

# Étape de production
FROM node:22-alpine

WORKDIR /app

# Installation uniquement des dépendances de production
COPY package*.json ./
RUN npm install --omit=dev

# Récupération du build frontend depuis l'étape précédente
COPY --from=build /app/dist ./dist

# Copie du fichier serveur backend
COPY server.ts ./

# Exposition du port 3000 (requis par la plateforme)
EXPOSE 3000

# Définition de l'environnement en production
ENV NODE_ENV=production

# Lancement du serveur avec le support natif de TypeScript (Node 22)
CMD ["node", "--experimental-strip-types", "server.ts"]