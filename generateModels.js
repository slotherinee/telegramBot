const { processModel } = require('./utils')

const generateModel = async (
  ctx,
  loadingMessageToUser,
  modelsData,
  optionalPrompt,
  isEmptyText
) => {
  const modelFnCallback = async (err, data) => {
    if (err != null) {
      ctx.reply('Не удалось сгенерировать изображение! Ошибка сервера! 😔')
    } else {
      try {
        await processModel(data, ctx, loadingMessageToUser)
      } catch (err) {
        ctx.reply(
          'Не удалось сгенерировать изображение! Произошла ошибка преобразования картинки! 😔'
        )
      }
    }
  }
  if (ctx.message.photo || ctx.message.sticker) {
    if (isEmptyText) {
      await modelsData.modelFn(
        {
          prompt: optionalPrompt || '',
          data: modelsData.optionalData,
        },
        modelFnCallback
      )
      return
    }
    if (!ctx.message?.caption?.replace(modelsData.name, '').trim()) {
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
        prompt: optionalPrompt || '',
        data: modelsData.optionalData,
      },
      modelFnCallback
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
      modelFnCallback
    )
  }
}

module.exports = generateModel
