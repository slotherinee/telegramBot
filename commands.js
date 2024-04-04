const modelsData = require('./models')

const commands = [
  '/dalle',
  '/prodia',
  '/emi',
  '/diffusion',
  '/xlprodia',
  '/xxlprodia',
  '/real',
  '/journey',
  '/cyber',
  '/mini',
]

const commandToModelData = commands.reduce((obj, command, index) => {
  obj[command] = modelsData[index]
  return obj
}, {})

module.exports = commandToModelData
