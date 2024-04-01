const modelsData = require('./models')

const commands = [
  '/dalle',
  '/prodia',
  '/render',
  '/pixelart',
  '/emi',
  '/diffusion',
  '/xlprodia',
  '/xxlprodia',
  '/real',
  '/journey',
  '/cyber',
  '/pixart',
  '/mini',
]

const commandToModelData = commands.reduce((obj, command, index) => {
  obj[command] = modelsData[index]
  return obj
}, {})

module.exports = commandToModelData
