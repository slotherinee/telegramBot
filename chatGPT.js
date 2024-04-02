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
        const response = data.gpt.replace(/```.*?\n[\s\S]*?```/g, match => {
          const code = match.replace(/```.*?\n|\n```/g, '')
          return '<pre><code>' + code + '</code></pre>'
        })
        console.log(data.gpt)
        ctx.telegram.editMessageText(
          ctx.chat.id,
          loadingMessageToUser.message_id,
          undefined,
          response,
          { parse_mode: 'HTML' }
        )
      }
    }
  )
}
module.exports = chatGPT
