const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { v4: uuidv4 } = require('uuid')

const convertFromBase64ToImage = async (data, ctx, loadingMessageToUser) => {
  const imageBase64 = data.images[0]
  const base64Image = imageBase64.replace(/^data:image\/jpeg;base64,/, '')
  const imageBuffer = Buffer.from(base64Image, 'base64')
  const imagePath = path.join(__dirname, `${uuidv4()}.jpg`)

  fs.writeFileSync(imagePath, imageBuffer)

  await sharp(imageBuffer, { density: 300 })
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

const convertFromBlobToImage = async (data, ctx, loadingMessageToUser) => {
  const buffer = Buffer.from(await data.arrayBuffer())
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

module.exports = {
  convertFromBase64ToImage,
  convertFromBlobToImage,
}
