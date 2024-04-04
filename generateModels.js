const {
  convertFromBase64ToImage,
  getImageFromUrl,
} = require("./convertFromBase64ToImage");

const generateModel = async (ctx, loadingMessageToUser, modelsData) => {
  if (!ctx.message.text.replace(modelsData.name, "").trim()) {
    ctx.reply(
      `Нужен текст после ${modelsData.name}, не оставляй запрос пустым. 😔 `
    );
    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      loadingMessageToUser.message_id
    );
    return;
  }
  await modelsData.modelFn(
    {
      prompt: ctx.message.text.replace(modelsData.name, "").trim(),
      data: modelsData.optionalData,
    },
    async (err, data) => {
      if (err != null) {
        console.log(err);
        ctx.reply("Не удалось сгенерировать изображение! 😔");
      } else {
        try {
          if (data.images) {
            await convertFromBase64ToImage(data, ctx, loadingMessageToUser);
          } else if (Array.isArray(data) && data[0].startsWith("http")) {
            getImageFromUrl(data[0], ctx, loadingMessageToUser);
          } else {
            ctx.reply("Не удалось сгенерировать изображение");
          }
        } catch (err) {
          console.log(err);
          ctx.reply("Не удалось сгенерировать изображение");
        }
      }
    }
  );
};

module.exports = generateModel;
