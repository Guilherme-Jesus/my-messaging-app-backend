import express, { Express } from 'express'
import { Server as HTTPServer } from 'http'
import { Server as WebSocketServer, WebSocket } from 'ws'
import cors from 'cors'
import serviceAccount from '../mensageria-b0e36-02471a185653.json'
const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const app: Express = express()
app.use(express.json())
app.use(cors())

const server: HTTPServer = new HTTPServer(app)

const wss: WebSocketServer = new WebSocketServer({ server })

interface Message {
  sender: string
  content: string
  timestamp: number
}

interface SignupRequest {
  email?: string
  password?: string
}

const messages: Message[] = [] // Armazena as mensagens

// Mantém um registro dos clientes conectados
const clients = new Set<WebSocket>()

function broadcastMessage(message: Message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}

// Função para limpar todas as mensagens a cada 1 hora
function cleanUpMessages() {
  messages.length = 0 // Limpa todas as mensagens
  console.log('Todas as mensagens foram removidas.')
}

// Agendar a limpeza para ocorrer a cada hora
setInterval(cleanUpMessages, 3600000)

wss.on('connection', (ws) => {
  clients.add(ws)
  console.log('Cliente conectado. Total de clientes:', clients.size)

  ws.on('message', (message) => {
    const msg: Message = JSON.parse(message.toString())
    msg.timestamp = Date.now()
    messages.push(msg)
    broadcastMessage(msg)
  })

  ws.on('close', () => {
    clients.delete(ws)
    console.log('Cliente desconectado. Total de clientes:', clients.size)
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    clients.delete(ws)
  })

  messages.forEach((msg) => ws.send(JSON.stringify(msg)))
})

app.post('/send-message', async (req, res) => {
  const message: Message = req.body

  try {
    // Buscar o usuário no Firebase para obter a photoURL
    const userRecord = await admin.auth().getUser(message.sender)
    const userPhotoURL = userRecord.photoURL // Supondo que o photoURL está disponível aqui

    const fullMessage = {
      ...message,
      photoURL: userPhotoURL, // Inclui a photoURL na mensagem
      timestamp: Date.now(),
    }

    messages.push(fullMessage)
    broadcastMessage(fullMessage)
    res.status(200).send({ status: 'Message sent' })
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    res.status(500).send({ error: 'Erro ao enviar mensagem' })
  }
})

app.post('/signup', async (req, res) => {
  const user: SignupRequest = {
    email: req.body.email,
    password: req.body.password,
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: user.email,
      password: user.password,
      emailVerified: false,
      disabled: false,
    })
    res.status(200).send(userRecord)
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    res.status(500).send({ error: 'Erro ao criar usuário' })
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
