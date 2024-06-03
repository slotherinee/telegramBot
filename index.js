require("dotenv").config()
const fs = require("fs").promises
const mongoose = require("mongoose")
const { Telegraf } = require("telegraf")
const { message } = require("telegraf/filters")
const generateModel = require("./generateModels")
const commandToModelData = require("./commands")
const { v4: uuidv4 } = require("uuid")
const {
    generateTextFromImage,
    processVoiceMessage,
    safeMarkdown
} = require("./utils")
const ChatHistory = require("./mongodbModel")
const { chatGPT, GPT4 } = require("./GPT-4")
const { sanitizeMarkdown } = require("telegram-markdown-sanitizer")

if (!process.env.TELEGRAM_TOKEN)
    throw new Error('"BOT_TOKEN" env var is required!')

const telegramToken = process.env.TELEGRAM_TOKEN
const bot = new Telegraf(telegramToken)

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Connected to MongoDB")
    } catch (error) {
        console.log("Error connecting to MongoDB:", error)
    }
}
connectToDB()

bot.start((ctx) => {
    ctx.reply(
        "*Привет!* 👋\n\n" +
            "Напиши мне что-нибудь и я постараюсь помочь! 😊\n\n" +
            "Также можешь отправить мне *голосовое сообщение* или *изображение*. Я попробую его понять и помочь с вашим вопросом 😉\n\n" +
            "Или используй команды: \n" +
            "/pg, /dalle, /prodia, /xlprodia, /xxlprodia,\n" +
            "/emi, /diffusion, /real, /render /journey,\n" +
            "/cyber, /pixelart, /anime, /anima для генерации картинок!\n\n" +
            "*Пример:*\n" +
            "*/pg spider-man*\n\n" +
            "Подобным запросом ты сгенерируешь фото человека паука!🕸 ️\n\n" +
            "Хочу заметить, что нейросеть лучше понимает запросы на генерации изображений на *английском языке*.",
        { parse_mode: "Markdown" }
    )
})

bot.command("clear", async (ctx) => {
    const chatId = ctx.chat.id
    await ChatHistory.findOneAndUpdate({ chatId }, { messages: [] })
    ctx.reply("Контекст очищен! 🧹")
})

bot.on(message("text"), async (ctx) => {
    try {
        if (!ctx.message.text) {
            ctx.reply("Пожалуйста, отправьте текстовое сообщение!")
        }
        const loadingMessageToUser = await ctx.reply("Генерирую...🙂")
        const command = `${ctx.message.text.split(" ")[0]}`
        if (command in commandToModelData) {
            await generateModel(
                ctx,
                loadingMessageToUser,
                commandToModelData[command]
            )
        } else {
            await chatGPT(ctx, loadingMessageToUser)
        }
    } catch (error) {
        console.error("Error handling message:", error)
        ctx.reply("Произошла ошибка при обработке запроса. 😔")
    }
})

const mediaGroupStore = new Map()

const handleMedia = async (ctx, generateTextFromImage) => {
    try {
        const mediaGroupId = ctx.message.media_group_id
        const largestPhoto = ctx.message.photo.pop()
        const fileId = largestPhoto.file_id

        if (mediaGroupId) {
            if (!mediaGroupStore.has(mediaGroupId)) {
                mediaGroupStore.set(mediaGroupId, { fileIds: [] })
            }

            mediaGroupStore.get(mediaGroupId).fileIds.push(fileId)

            setTimeout(async () => {
                const mediaGroupData = mediaGroupStore.get(mediaGroupId)
                if (!mediaGroupData) return

                const { fileIds } = mediaGroupData

                mediaGroupStore.delete(mediaGroupId)

                const imageFilePaths = []
                for (const fileId of fileIds) {
                    let fileLink
                    try {
                        fileLink = await bot.telegram.getFileLink(fileId)
                    } catch (error) {
                        console.error("Failed to get file link:", error)
                        ctx.reply(
                            "An error occurred while getting the file link. Please try again."
                        )
                        return
                    }

                    const response = await fetch(fileLink.href)
                    const photoData = await response.arrayBuffer()
                    const pathname = new URL(fileLink.href).pathname
                    const format = pathname.split("/").pop().split(".").pop()
                    const inputFileName = `${uuidv4()}.${format}`

                    try {
                        await fs.writeFile(
                            inputFileName,
                            new Uint8Array(photoData)
                        )
                    } catch (error) {
                        console.error("Failed to write file:", error)
                        ctx.reply(
                            "An error occurred while writing the file. Please try again."
                        )
                        return
                    }

                    imageFilePaths.push(inputFileName)
                }

                const loadingMessage = await ctx.reply("Генерирую...🙂")

                const userCaption = ctx.message.caption
                if (userCaption) {
                    const command = userCaption.split(" ")[0]
                    if (command in commandToModelData) {
                        const generatedText = await generateTextFromImage(
                            imageFilePaths[0]
                        )
                        generateModel(
                            ctx,
                            loadingMessage,
                            commandToModelData[command],
                            `${generatedText} ${userCaption}`
                        )
                    } else {
                        await chatGPT(ctx, loadingMessage, imageFilePaths)
                    }
                } else {
                    await chatGPT(ctx, loadingMessage, imageFilePaths)
                }

                for (const imageFilePath of imageFilePaths) {
                    try {
                        await fs.unlink(imageFilePath)
                    } catch (error) {
                        console.error("Failed to delete file:", error)
                    }
                }
            }, 500)
        } else {
            let fileLink
            try {
                fileLink = await bot.telegram.getFileLink(fileId)
            } catch (error) {
                console.error("Failed to get file link:", error)
                ctx.reply(
                    "An error occurred while getting the file link. Please try again."
                )
                return
            }

            const response = await fetch(fileLink.href)
            const photoData = await response.arrayBuffer()
            const pathname = new URL(fileLink.href).pathname
            const format = pathname.split("/").pop().split(".").pop()
            const inputFileName = `${uuidv4()}.${format}`

            try {
                await fs.writeFile(inputFileName, new Uint8Array(photoData))
            } catch (error) {
                console.error("Failed to write file:", error)
                ctx.reply(
                    "An error occurred while writing the file. Please try again."
                )
                return
            }

            const loadingMessage = await ctx.reply("Генерирую...🙂")

            const userCaption = ctx.message.caption
            if (userCaption) {
                const command = userCaption.split(" ")[0]
                if (command in commandToModelData) {
                    const generatedText = await generateTextFromImage(
                        inputFileName
                    )
                    generateModel(
                        ctx,
                        loadingMessage,
                        commandToModelData[command],
                        `${generatedText} ${userCaption}`
                    )
                } else {
                    await chatGPT(ctx, loadingMessage, [inputFileName])
                }
            } else {
                await chatGPT(ctx, loadingMessage, [inputFileName])
            }

            try {
                await fs.unlink(inputFileName)
            } catch (error) {
                console.error("Failed to delete file:", error)
            }
        }
    } catch (error) {
        console.log(error)
        ctx.reply("Произошла ошибка при обработке запроса. 😔")
    }
}

bot.on(message("sticker"), async (ctx) => {
    ctx.reply("Извините, я не говорю на языке стикеров! 😔")
})

bot.on("photo", async (ctx) => {
    await handleMedia(ctx, generateTextFromImage)
})

bot.on("voice", async (ctx) => {
    const chatId = ctx.chat.id
    const username =
        ctx.message.from.username ||
        ctx.message.from.first_name ||
        "no username"

    let chat = await ChatHistory.findOne({ chatId })
    if (!chat) {
        chat = new ChatHistory({ chatId, username, messages: [] })
    }

    if (!chat.username) {
        chat.username = username
    }

    if (!chat.messages) {
        chat.messages = []
    }

    const loadingMessageToUser = await ctx.reply(
        "Пытаюсь распознать сообщение...👂"
    )
    const fileId = ctx.message.voice.file_id
    const voiceLink = await bot.telegram.getFileLink(fileId)
    const response = await fetch(voiceLink.href)
    const voiceData = await response.arrayBuffer()
    const fileName = `${uuidv4()}.mp3`
    await fs.writeFile(fileName, new Uint8Array(voiceData))

    try {
        const voiceResponse = await processVoiceMessage(fileName)
        const gotVoiceResponse = await ctx.reply("Генерирую ответ...🙂")
        chat.messages.push({ role: "user", content: voiceResponse })
        await chat.save()

        const data = await GPT4(chat.messages)
        if (data instanceof Error) {
            throw new Error(data.message)
        }
        const response = sanitizeMarkdown(data)
            .replace(/\\/g, "")
            .replace(/^\*(?=\s)/gm, "•")
            .replace(/\*\*(?=\S)(.*?)(?<=\S)\*\*/g, "*$1*")
        chat.messages.push({ role: "assistant", content: response })

        ctx.telegram.deleteMessage(ctx.chat.id, loadingMessageToUser.message_id)
        ctx.telegram.deleteMessage(ctx.chat.id, gotVoiceResponse.message_id)

        ctx.reply(response, { parse_mode: "Markdown" })
        await chat.save()
    } catch (err) {
        console.log(err)
        ctx.reply("Произошла ошибка при обработке голосового сообщения. 😔")
    } finally {
        if (fileName) {
            await fs.unlink(fileName)
        }
    }
})

bot.catch((err, ctx) => {
    console.error("Ошибка:", err)
    ctx.reply("Произошла ошибка при обработке запроса. 😔")
})

try {
    bot.launch()
    console.log("Bot launched successfully")
} catch (error) {
    console.log(error)
}

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
