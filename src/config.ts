import serviceAccount from '../mensageria-b0e36-02471a185653.json'
const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})
