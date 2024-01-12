# web-chat-gh

## Overview

Este projeto é um backend para um aplicativo de mensagens em tempo real. Ele utiliza o Express.js para lidar com requisições HTTP e o WebSocket para comunicações em tempo real. Além disso, integra-se com o Firebase para autenticação dos usuários.

## Funcionalidades

- **WebSocket**: Suporte para mensagens em tempo real.
- **Autenticação Firebase**: Validação de tokens JWT para identificar usuários.
- **Express.js**: Gerenciamento de rotas HTTP.

## Como Funciona

Quando um usuário se conecta ao WebSocket, ele pode enviar mensagens que são transmitidas em tempo real para todos os usuários conectados. A rota `/login` valida tokens JWT fornecidos pelo Firebase, permitindo a autenticação segura de usuários e criação de usuários.

## Estrutura do Projeto

- `index.ts`: Ponto de entrada principal do aplicativo. Configura o servidor HTTP e WebSocket e define as rotas.

## Requisitos

- Node versão lts
- Firebase Admin SDK (para autenticação)
- WebSocket
- Express.js

## Setup

### Configuração do Firebase

1. Inicialize o Firebase Admin SDK com suas credenciais.
2. Configure as variáveis de ambiente para as credenciais do Firebase.

### Inicialização do Servidor

Execute `npm install` para instalar as dependências necessárias e depois `npm start` para iniciar o servidor local.

## Uso

### WebSocket

Os clientes podem se conectar ao WebSocket para enviar e receber mensagens em tempo real.

### Autenticação

Envie um `POST` para `/login` com um token JWT fornecido pelo Firebase para autenticar o usuário.

## Contribuições

Contribuições são bem-vindas! Abra uma PR para sugerir melhorias ou adicionar funcionalidades.