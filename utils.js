const fs = require('fs')
const path = require('path')

const { HfInference } = require('@huggingface/inference')
const hf = new HfInference(process.env.HUGGING_FACE_TOKEN)

const sharp = require('sharp')
const { v4: uuidv4 } = require('uuid')

const generateTextFromImage = async inputFileName => {
  const classification = async () => {
    const result = await hf.imageToText({
      data: fs.readFileSync(inputFileName),
      model: 'Salesforce/blip-image-captioning-large',
    })
    return result
  }
  const data = await classification()
  return data['generated_text']
}

const handleMedia = async (
  ctx,
  fileId,
  loadingMessage,
  generateTextFromImage
) => {
  let inputFileName
  try {
    const fileLink = await bot.telegram.getFileLink(fileId)
    const response = await fetch(fileLink.href)
    const photoData = await response.arrayBuffer()
    const pathname = new URL(fileLink.href).pathname
    const format = pathname.split('/').pop().split('.').pop()
    inputFileName = `${uuidv4()}.${format}`
    fs.writeFileSync(inputFileName, new Uint8Array(photoData))
    const generatedText = await generateTextFromImage(inputFileName)
    const randomCommandOfCommands =
      Object.keys(commandToModelData)[
        Math.floor(Math.random() * Object.keys(commandToModelData).length)
      ]
    const command = randomCommandOfCommands
    generateModel(
      ctx,
      loadingMessage,
      commandToModelData[command],
      generatedText
    )
  } catch (error) {
    console.log(error)
    ctx.reply('Произошла ошибка при обработке запроса. 😔')
  } finally {
    if (inputFileName) {
      fs.unlinkSync(inputFileName)
    }
  }
}

const convertFromBase64ToImage = async (data, ctx, loadingMessageToUser) => {
  const imageBase64 = data.images[0]
  const base64Image = imageBase64.replace(/^data:image\/jpeg;base64,/, '')
  const imageBuffer = Buffer.from(base64Image, 'base64')

  await processImage(imageBuffer, ctx, loadingMessageToUser)
}

const convertFromBlobToImage = async (data, ctx, loadingMessageToUser) => {
  const buffer = Buffer.from(await data.arrayBuffer())

  await processImage(buffer, ctx, loadingMessageToUser)
}

async function processImage(buffer, ctx, loadingMessageToUser) {
  const imagePath = path.join(__dirname, `${uuidv4()}.jpg`)
  fs.writeFileSync(imagePath, buffer)

  await sharp(buffer, { density: 300 })
    .resize(1024, 1024, {
      kernel: sharp.kernel.lanczos3,
      interpolator: sharp.interpolators.nohalo,
    })
    .toFile(imagePath, { force: true })

  await ctx.replyWithPhoto(
    { source: imagePath },
    {
      caption: ctx.message.text
        ? ctx.message.text
            .split(' ')
            .slice(1)
            .join(' ')
            .replace(/^\/[^ ]+/, '')
        : '',
    }
  )

  await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessageToUser.message_id)
  fs.unlinkSync(imagePath)
}

const processModel = async (data, ctx, loadingMessageToUser) => {
  if (data.images) {
    await convertFromBase64ToImage(data, ctx, loadingMessageToUser)
  } else if (data instanceof Blob) {
    await convertFromBlobToImage(data, ctx, loadingMessageToUser)
  } else {
    ctx.reply('Не удалось сгенерировать изображение! 😔')
  }
}

module.exports = {
  convertFromBase64ToImage,
  convertFromBlobToImage,
  generateTextFromImage,
  handleMedia,
  processModel,
}
