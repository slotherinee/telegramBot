const convertFromBase64ToImage = require('./convertFromBase64ToImage')

const generateModel = async (ctx, loadingMessageToUser, modelsData) => {
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
  modelsData.modelFn(
    {
      prompt: ctx.message.text.replace(modelsData.name, '').trim(),
      data: modelsData.optionalData,
    },
    async (err, data) => {
      if (err != null) {
        ctx.reply('Не удалось сгенерировать изображение! 😔')
      } else {
        try {
          if (data && data.images) {
            convertFromBase64ToImage(data, ctx, loadingMessageToUser)
          } else {
            ctx.reply('Не удалось сгенерировать изображение! 😔')
          }
        } catch (err) {
          ctx.reply('Не удалось сгенерировать изображение! 😔')
        }
      }
    }
  )
}

module.exports = generateModel
