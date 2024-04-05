const {
  convertFromBase64ToImage,
  convertFromBlobToImage,
} = require('./convertFromBase64ToImage')

const generateModel = async (
  ctx,
  loadingMessageToUser,
  modelsData,
  optionalPrompt
) => {
  if (ctx.message.photo) {
    await modelsData.modelFn(
      {
        prompt: optionalPrompt || '',
        data: modelsData.optionalData,
      },
      async (err, data) => {
        if (err != null) {
          console.log(err)
          ctx.reply('Не удалось сгенерировать изображение! 😔')
        } else {
          try {
            if (data.images) {
              await convertFromBase64ToImage(data, ctx, loadingMessageToUser)
            } else if (data instanceof Blob) {
              await convertFromBlobToImage(data, ctx, loadingMessageToUser)
            } else {
              ctx.reply('Не удалось сгенерировать изображение! 😔')
            }
          } catch (err) {
            console.log(err)
            ctx.reply('Не удалось сгенерировать изображение! 😔')
          }
        }
      }
    )
  } else if (ctx.message.text) {
    if (!ctx.message.text.replace(modelsData.name, '').trim()) {
      ctx.reply(
        `Нужен текст после ${modelsData.name}, не оставляй запрос пустым. 😔 `
      )
      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        loadingMessageToUser.message_id
      )
      return
    }
    await modelsData.modelFn(
      {
        prompt:
          optionalPrompt + `${ctx.message.text ? ctx.message.text : ''}` ||
          ctx.message.text.replace(modelsData.name, '').trim() ||
          '',
        data: modelsData.optionalData,
      },
      async (err, data) => {
        if (err != null) {
          console.log(err)
          ctx.reply('Не удалось сгенерировать изображение! 😔')
        } else {
          try {
            if (data.images) {
              await convertFromBase64ToImage(data, ctx, loadingMessageToUser)
            } else if (data instanceof Blob) {
              await convertFromBlobToImage(data, ctx, loadingMessageToUser)
            } else {
              ctx.reply('Не удалось сгенерировать изображение! 😔')
            }
          } catch (err) {
            console.log(err)
            ctx.reply('Не удалось сгенерировать изображение! 😔')
          }
        }
      }
    )
  }
}

module.exports = generateModel
