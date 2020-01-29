class WebControlServer {
  constructor (server) {
    this.io = require('socket.io')(server)
    this.screenClients = []
    this.controllerClients = []
    this.sessionDurationInHours = 1
    this.io.on('connection', function (socket) {
      socket.on('linkController', linkController)
      socket.on('alreadyLinked', alreadyLinked)
      socket.on('getSpecialNumber', createScreenSession)
      socket.on('data', processData)
    })

    const linkController = (specialNumber, socketId) => {
      this.linkController(specialNumber, socketId)
    }

    const alreadyLinked = (specialNumber, socketId) => {
      this.alreadyLinked(specialNumber, socketId)
    }

    const createScreenSession = (socketId, storedSpecialNumber) => {
      this.createScreenSession(socketId, storedSpecialNumber)
    }

    const processData = (data, originSocketId, specialNumber) => {
      this.processData(data, originSocketId, specialNumber)
    }
  }

  url (url, specialNumber) {
    const destinationSocketId = this.getClientBySpecialNumber(specialNumber).id
    this.io.to(`${destinationSocketId}`).emit('urlRedirect', url)
  }

  processData (data, originSocketId, specialNumber) {
    if (this.clientHad(specialNumber) && this.isUrl(data)) {
      const destinationSocketId = this.getClientBySpecialNumber(specialNumber).id
      this.io.to(`${destinationSocketId}`).emit('urlRedirect', data)
    } else {
      this.io.to(`${originSocketId}`).emit('data', 'error')
    }
  }

  isUrl (value) {
    // must include https:// or http
    // eslint-disable-next-line
    var expression = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gi
    var regex = new RegExp(expression)

    return value.match(regex)
  }

  alreadyLinked (specialNumber, socketId) {
    if (this.clientHad(specialNumber)) {
      this.io.to(`${socketId}`).emit('alreadyLinked', true)
    } else {
      this.io.to(`${socketId}`).emit('alreadyLinked', false)
    }
  }

  linkController (specialNumber, socketId) {
    if (this.clientHad(specialNumber)) {
      const clientSocketId = this.getClient(specialNumber)
      this.storeControllerClient(specialNumber, socketId, clientSocketId)
      this.io.to(`${socketId}`).emit('linkController', {
        clientSocketId: clientSocketId,
        specialNumber: specialNumber
      })
    } else {
      this.io.to(`${socketId}`).emit('linkController', 'error')
    }
  }

  createScreenSession (socketId, storedSpecialNumber) {
    const clientWithSpecialNumber = this.getClientBySpecialNumber(storedSpecialNumber)
    if (!clientWithSpecialNumber || this.invalidSession(storedSpecialNumber)) {
      // new screen client
      this.removeInvalidClient(storedSpecialNumber)
      this.createClient(socketId)
    } else {
      // client already exists
      let client = this.getClientBySpecialNumber(storedSpecialNumber)
      // updates client socketId
      client = this.updateControlId(client, 'id', socketId)
      // sends data to the client
      this.sendData(client, socketId)
    }
  }

  storeControllerClient (specialNumber, controllerClientSocketId, clientSocketId) {
    const reg = {
      controllerSocketId: controllerClientSocketId,
      clientSocketId: clientSocketId,
      specialNumber: specialNumber
    }
    this.controllerClients.push(reg)
    console.log('controllerClients', this.controllerClients)
  }

  isIncluded (attribute, value, collection) {
    return collection.some((obj) => {
      return obj[attribute] === value
    })
  }

  findBy (attribute, value, collection) {
    return collection.find((obj) => {
      return obj[attribute] === value
    })
  }

  clientHad (specialNumber) {
    return this.isIncluded('specialNumber', specialNumber, this.screenClients)
  }

  clientExist (socketId) {
    return this.isIncluded('id', socketId, this.screenClients)
  }

  getClient (specialNumber) {
    const client = this.findBy('specialNumber', specialNumber, this.screenClients)
    return client.id
  }

  getClientById (socketId) {
    return this.findBy('id', socketId, this.screenClients)
  }

  getClientBySpecialNumber (specialNumber) {
    return this.findBy('specialNumber', specialNumber, this.screenClients)
  }

  getControllerBySpecialNumber (specialNumber) {
    return this.findBy('specialNumber', specialNumber, this.controllerClients)
  }

  getUnusedRandom () {
    let aRandomNumber = this.getRandom(1000, 9999)
    const repited = (element) => element.specialNumber === aRandomNumber
    let unusedRandom = this.screenClients.some(repited)
    while (unusedRandom) {
      aRandomNumber = this.getRandom(1000, 9999)
      unusedRandom = this.screenClients.some(repited)
    }

    return aRandomNumber
  }

  getRandom (min, max) {
    return Math.floor(Math.random() * (max - min)) + min
  }

  sendData (client, socketId) {
    console.log('sendData', this.screenClients)
    // sending specialNumber to screen client
    this.io.to(`${socketId}`).emit('getSpecialNumber', client)
  }

  sessionExpired (sessionTimestamp) {
    const timeSpanInSeconds = (Date.now() - sessionTimestamp) / 1000
    const timeSpanInHours = timeSpanInSeconds / 3600
    return timeSpanInHours > this.sessionDurationInHours
  }

  invalidSession (storedSpecialNumber) {
    let isValid = false
    const client = this.getClientBySpecialNumber(storedSpecialNumber)
    if (client) {
      isValid = this.sessionExpired(client.timestamp)
    }
    return isValid
  }

  createClient (socketId) {
    // create new client
    const client = {
      id: socketId,
      specialNumber: this.getUnusedRandom(),
      timestamp: Date.now()
    }
    this.screenClients.push(client)
    this.sendData(client, socketId)
  }

  removeInvalidClient (storedSpecialNumber) {
    if (this.invalidSession(storedSpecialNumber)) {
      this.screenClients = this.screenClients.filter(client => client.specialNumber !== storedSpecialNumber)
    }
  }

  updateControlId (control, id, socketId) {
    control[id] = socketId
    return control
  }
}

module.exports = WebControlServer
