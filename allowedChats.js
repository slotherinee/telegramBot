require('dotenv').config()

const {
  ALLOWED_CHAT_ID1,
  ALLOWED_CHAT_ID2,
  ALLOWED_CHAT_ID3,
  ALLOWED_CHAT_ID4,
  ALLOWED_CHAT_ID5,
  ALLOWED_CHAT_ID6,
  ALLOWED_CHAT_ID7,
  ALLOWED_CHAT_ID8,
  ALLOWED_CHAT_ID9,
  ALLOWED_CHAT_ID10,
} = process.env

const allowedChatIds = (...ids) => [...ids]
const allowedChats = allowedChatIds(
  ALLOWED_CHAT_ID1,
  ALLOWED_CHAT_ID2,
  ALLOWED_CHAT_ID3,
  ALLOWED_CHAT_ID4,
  ALLOWED_CHAT_ID5,
  ALLOWED_CHAT_ID6,
  ALLOWED_CHAT_ID7,
  ALLOWED_CHAT_ID8,
  ALLOWED_CHAT_ID9,
  ALLOWED_CHAT_ID10
)

module.exports = {
  allowedChats,
}