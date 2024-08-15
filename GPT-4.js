const fs = require("fs/promises");
const ChatHistory = require("./mongodbModel");
const OpenAI = require("openai");
const googleIt = require("google-it");
const { safeMarkdown } = require("./utils");
const { markdownToTxt } = require("markdown-to-txt");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.BASE_URL,
});

const openai_second = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_SECOND,
  baseURL: process.env.BASE_URL_SECOND,
});

async function chatGPT(ctx, loadingMessageToUser, imageFilePaths = []) {
  try {
    let userMessage = ctx.message.text || ctx.message.caption || "";
    const chatId = ctx.chat.id;
    const username =
      ctx.message.from.username || ctx.message.from.first_name || "no username";

    let chat = await ChatHistory.findOne({ chatId });
    if (!chat) {
      chat = new ChatHistory({
        chatId,
        username,
        messages: [],
      });
    }

    if (!chat.username) {
      chat.username = username;
    }

    if (!chat.messages) {
      chat.messages = [];
    }

    if (chat.messages.length > 80) {
      chat.messages = [];
    }

    const { chances } = await getPercentage(userMessage);
    const googleResult =
      chances > 75
        ? await googleIt({
            "no-display": true,
            query: userMessage,
          })
        : "";

    if (imageFilePaths.length === 0) {
      chat.messages.push({
        role: "user",
        content:
          googleResult !== ""
            ? userMessage +
              ". " +
              "\n\n" +
              "Google search results: " +
              JSON.stringify(googleResult)
            : userMessage,
      });
    } else {
      const messageContent = [{ type: "text", text: userMessage }];
      for (const imageFilePath of imageFilePaths) {
        const imageBuffer = await fs.readFile(imageFilePath);
        const base64Image = imageBuffer.toString("base64");
        messageContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          },
        });
      }
      chat.messages.push({
        role: "user",
        content: messageContent,
      });
    }

    try {
      await chat.save();
    } catch (error) {
      console.error("Failed to save chat:", error);
      ctx.reply("An error occurred while saving the chat. Please try again.");
      return;
    }

    const data = await GPT4(chat.messages, googleResult);
    if (data instanceof Error) {
      throw new Error(data.message);
    }
    const response = markdownToTxt(data);
    console.log("response", response);

    chat.messages.push({ role: "assistant", content: response });

    try {
      if (loadingMessageToUser && "message_id" in loadingMessageToUser) {
        ctx.telegram.deleteMessage(
          ctx.chat.id,
          loadingMessageToUser.message_id
        );
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }

    try {
      await ctx.reply(response);
    } catch (error) {
      console.error("Failed to send reply:", error);
      ctx.reply(
        "Не удалось сгенерировать ответ! Попробуйте очистить контекст и повторить ваш запрос еще раз. 😔"
      );
    }

    try {
      await chat.save();
    } catch (error) {
      console.error("Failed to save chat:", error);
      ctx.reply("An error occurred while saving the chat. Please try again.");
    }
  } catch (error) {
    console.log(error);
    ctx.reply(
      "Не удалось сгенерировать ответ! Попробуйте очистить контекст и повторить ваш запрос еще раз. 😔"
    );
    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      loadingMessageToUser.message_id
    );
  }
}

async function GPT4(messages) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a GPT-4 made by OpenAI, helpful telegram chat-bot assistant! Make sure your response will be helpful and informative. Speak with user the language he speaks with you.  If you are not sure about the answer, you can ask the user for more information. You can give user up to 4096 characters of response, if response should be bigger ask if user want to get the response in separate messages.
                    Also you sometimes can get Google search results with users message which would start like "Google search results:", you should analyze both users and google search results and answer user question, you dont need to just copy paste the google search results, you should analyze it and provide the user with the most relevant information based on that information. You can also don't include google information in your response to user if you feel like you can 100% answer yourself. You can also sometimes provide to user hyperlinks to the google search results if you think that would be helpful for user.
                    Additional info: today is ${new Date()} and current time is ${new Date().toLocaleTimeString()}`,
        },
        ...messages,
      ],
    });
    if (
      response.choices &&
      response.choices[0] &&
      response.choices[0].message &&
      response.choices[0].message.content
    ) {
      return response.choices[0].message.content;
    } else {
      throw new Error("Unexpected response format");
    }
  } catch (error) {
    console.log(error);
    throw new Error(
      "Не удалось сгенерировать ответ! Попробуйте очистить контекст и повторите ваш запрос еще раз. 😔"
    );
  }
}

const googleChances = async (userQuery) => {
  try {
    if (!userQuery) {
      return "0%";
    }
    const response = await openai_second.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You get user query. You should analyze it and should provide the user with percentages of that if their question is realtime question that should be googled (you would not answer user's question without Google if you had to) or not where 0% is no need for realtime data and you can answer yourself (such as who are you, describe image, read user code, request for write some poem, block of code or if you feel that user query is additional question about the question you already told everything about and etc.) and 100% is the need for realtime data and you can't answer yourself without Google information. You should return only the percentage number as a string in format: 42%",
        },
        {
          role: "user",
          content: userQuery,
        },
      ],
      model: "gpt-3.5-turbo",
    });
    return response?.choices[0]?.message?.content;
  } catch (err) {
    console.log("Google error", err);
  }
};

async function getPercentage(userQuery) {
  const response = await googleChances(userQuery);
  const chances = convertToInteger(response);
  return {
    chances,
    userQuery,
  };
}

function convertToInteger(str) {
  if (str) {
    return parseInt(str.replace("%", "").trim(), 10);
  }
}

module.exports = {
  chatGPT,
  GPT4,
  googleChances,
  getPercentage,
};
