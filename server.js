import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { configDotenv } from 'dotenv'
import { CohereClient } from "cohere-ai"
import { AbortController } from 'abortcontroller-polyfill/dist/cjs-ponyfill.js'
configDotenv()

const controller = new AbortController()

const app = express()
const port = 3000
const URL = 'https://dnd-dwarves.netlify.app/.netlify/functions/bot'

app.use(cors())
app.use(express.json())

const cohere = new CohereClient({
	token: process.env.OPENAI_API_KEY
})

function prepareMessagesForCohere(messages) {
	const preparedMessages = messages.map(oldMessage => {
		const newMessage = {
			role: '',
			message: ''
		}

		newMessage.message = oldMessage.content

		switch (oldMessage.role) {
			case 'system':
				newMessage.role = 'SYSTEM'
				break;

			case 'assistant':
				newMessage.role = 'CHATBOT'
				break;

			case 'user':
				newMessage.role = 'USER'
				break;
		
			default:
				break;
		}

		return newMessage
	})

	return preparedMessages
}

async function getCompletion(messages) {
	const preparedMessages = prepareMessagesForCohere(messages)
	const chat = await cohere.chat({
		model: "command-r",
		chatHistory: preparedMessages,
		message: 'The players have made their move, now it is your turn, Dungeon Master.'
	})
	return chat
}

// ==================================

app.get('/test', async (req, res) => {
	res.send('Hello World!')
	const response = await axios.post('https://jsonplaceholder.typicode.com/posts', {
			id: 117,
			title: 'test axios',
			signal: controller.signal
		})
	console.log('axios.post status: ', response.status)
	console.log(response.data)
	return
})

app.post('/', async (req, res) => {
	try {
		res.send({ status: 'ok' })
		const data = req.body
		const completion = await getCompletion(data.messages)
		const response = await axios.post(URL, {
			myMark: 'completion',
			chat_id: data.chat_id,
			message_id: data.message_id,
			completion: completion.text,
			signal: controller.signal
		})
		console.log('axios.post status: ', response.status)
		return
	} catch (e) {
		console.log('in catch: ', e)
	}
})

app.listen(port, () => {
	console.log(`server started on port ${port}`)
})




