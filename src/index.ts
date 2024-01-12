import express, { Express } from "express";
import { Server as HTTPServer } from "http";
import { Server as WebSocketServer } from "ws";
import admin from "firebase-admin";

const app: Express = express();
app.use(express.json()); // Para parsear corpos de requisição JSON

// Cria o servidor HTTP a partir da aplicação Express
const server: HTTPServer = new HTTPServer(app);

// Inicializa o WebSocket Server
const wss: WebSocketServer = new WebSocketServer({ server });

interface Message {
  sender: string;
  content: string;
}
interface LoginRequest {
  idToken: string;
}

// Estrutura de dados para a resposta de login
interface LoginResponse {
  success: boolean;
  uid?: string;
  message?: string;
}

const messages: Message[] = [];

// Função para enviar mensagens para todos os clientes conectados
function broadcastMessage(message: Message) {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(message));
  });
}

// Configuração do WebSocket
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const msg: Message = JSON.parse(message.toString());
    messages.push(msg);
    broadcastMessage(msg);
  });

  // Enviar histórico de mensagens para novos clientes
  messages.forEach((msg) => ws.send(JSON.stringify(msg)));
});

app.post("/login", async (req, res) => {
  const loginRequest: LoginRequest = req.body;

  // Verifica se o token JWT é válido
  try {
    const decodedToken = await admin.auth().verifyIdToken(loginRequest.idToken);
    const uid = decodedToken.uid;
    const loginResponse: LoginResponse = {
      success: true,
      uid,
      message: "Login realizado com sucesso",
    };
    res.status(200).send(loginResponse);
  } catch (error) {
    const loginResponse: LoginResponse = {
      success: false,
      message: "Token inválido",
    };
    res.status(401).send(loginResponse);
  }
});

// Inicia o servidor para ouvir em todas as interfaces de rede
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
