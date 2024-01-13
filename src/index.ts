import express, { Express } from 'express'
import { Server as HTTPServer } from 'http'
import { Server as WebSocketServer } from 'ws'
import cors from 'cors'
import serviceAccount from '../mensageria-b0e36-02471a185653.json'
const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const app: Express = express()
app.use(express.json()) // Para parsear corpos de requisição JSON
app.use(cors())
// Cria o servidor HTTP a partir da aplicação Express
const server: HTTPServer = new HTTPServer(app)

// Inicializa o WebSocket Server
const wss: WebSocketServer = new WebSocketServer({ server })

interface Message {
  sender: string
  content: string
}

interface SignupRequest {
  email?: string
  password?: string
}

const messages: Message[] = []

// Função para enviar mensagens para todos os clientes conectados
function broadcastMessage(message: Message) {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(message))
  })
}

// Configuração do WebSocket
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const msg: Message = JSON.parse(message.toString())
    messages.push(msg)
    broadcastMessage(msg)
  })

  // Enviar histórico de mensagens para novos clientes
  messages.forEach((msg) => ws.send(JSON.stringify(msg)))
})

app.post('/signup', async (req, res) => {
  const user: SignupRequest = {
    email: req.body.email,
    password: req.body.password,
  }
  const userRecord = await admin.auth().createUser({
    email: user.email,
    password: user.password,
    emailVerified: false,
    disabled: false,
  })
  res.status(200).send(userRecord)
})

// Inicia o servidor para ouvir em todas as interfaces de rede
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
