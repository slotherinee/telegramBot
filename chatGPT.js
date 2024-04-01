const { gpt } = require('gpti')

const chatGPT = (ctx, loadingMessageToUser) => {
  gpt(
    {
      messages: [
        {
          role: 'user',
          content: ctx.message.text,
        },
      ],
      model: 'GPT-4',
      markdown: false,
    },
    (err, data) => {
      if (err !== null) {
        ctx.reply('Не удалось сгенерировать текст! Попробуйте еще раз. 😔')
      } else {
        console.log(data.gpt)
        ctx.telegram.editMessageText(
          ctx.chat.id,
          loadingMessageToUser.message_id,
          undefined,
          data.gpt
        )
      }
    }
  )
}
module.exports = chatGPT
