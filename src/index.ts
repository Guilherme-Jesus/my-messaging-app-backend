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

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean
}

const wss: WebSocketServer = new WebSocketServer({ server })

interface Message {
  sender: string
  content: string
  timestamp: number
  photoURL?: string
}

interface SignupRequest {
  email?: string
  password?: string
}

const messages: Message[] = []

const clients = new Set<WebSocket>()

function broadcastMessage(message: Message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}

function cleanUpMessages() {
  messages.length = 0
  console.log('Todas as mensagens foram removidas.')
}

setInterval(cleanUpMessages, 1800000)

wss.on('connection', (ws: ExtendedWebSocket) => {
  ws.isAlive = true
  clients.add(ws)

  ws.on('pong', () => {
    ws.isAlive = true
  })

  ws.on('message', (message) => {
    const msg: Message = JSON.parse(message.toString())
    msg.timestamp = Date.now()
    msg.photoURL = admin.auth().currentUser?.photoURL
    messages.push(msg)
    broadcastMessage(msg)
  })

  ws.on('close', () => {
    clients.delete(ws)
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    clients.delete(ws)
  })

  messages.forEach((msg) => ws.send(JSON.stringify(msg)))
})

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const extWs = ws as ExtendedWebSocket // Faz a asserção de tipo aqui

    if (!extWs.isAlive) return extWs.terminate()

    extWs.isAlive = false
    extWs.ping()
  })
}, 30000)

wss.on('close', () => {
  clearInterval(interval)
})

app.post('/send-message', (req, res) => {
  const message: Message = req.body
  message.timestamp = Date.now()

  messages.push(message)
  broadcastMessage(message)
  res.status(200).send({ status: 'Message sent' })
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
