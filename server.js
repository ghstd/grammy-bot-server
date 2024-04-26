import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { configDotenv } from 'dotenv'
import { AbortController } from "node-abort-controller"
configDotenv()

const controller = new AbortController()

const app = express()
const port = 3000
const URL = 'https://dnd-dwarves.netlify.app/.netlify/functions/bot'

const API_URL = 'https://api.cohere.ai/v1/chat'
const API_KEY = process.env.OPENAI_API_KEY

const config = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `bearer ${API_KEY}`
  },
	signal: controller.signal
}

app.use(cors())
app.use(express.json())

const PREAMBLE = `
	## Задача и Контекст
	вы — мастер игры подземелья и драконы;
	игра будет проходить в формате текстового диалога;
	игра будет представлять собой короткое путешествие от начальной точки до конечной точки;
	в путешествии будет участвовать один или несколько игроков;
	каждому игроку помимо имени будет присвоен его идентификатор, с помощью этого идентификатора вы сможете различать игроков, когда они говорят, однако вы должны обращаться к игрокам по имени или по их отличительным чертам, например: "Дорогой мистер Гном" или "Мистер Хоббит";
	в начале игрып попросите игроков представиться, например: узнать имя игрока, расу, профессию, навыки;
	после того, как игроки представятся, пожалуйста, кратко опишите вступительную сцену начала путешествия, затем ожидайте ответов от игроков;
	
	## Руководство по стилю
	на пути игроки должны встретить различных противников из вселенной Dungeons and Dragons;
	на пути также должны быть различного рода препятствия и развилки, где игрокам придется выбирать дальнейшее направление пути;
	игроки могут найти различные предметы, например: меч, лук, зелье здоровья и тому подобное;
	во время игры, в зависимости от обстоятельств, вы имеете право ограничивать игроков в действиях, например: у вас сломан меч, вы забыли в таверне колчан со стрелами, свое заклинание испорчен, доспехи твои заржавели, удары твои не действуют и тому подобное;
	старайтесь быть умеренно краткими в описаниях.
`

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
	let message = 'начните путешествие'
	if (preparedMessages.length === 1) {
		message = preparedMessages.splice(-1).join('\n')
	} else if (preparedMessages.length > 1) {
		message = preparedMessages.splice(-2).join('\n')
	}
	console.log(message)
	const data = {
		model: "command-r",
		chatHistory: preparedMessages,
		preamble: PREAMBLE,
		message: message
	}
	const response = axios.post(API_URL, data, config)
	return response
}

// ==================================

app.get('/test', async (req, res) => {
	res.send('Hello World!')
	const response = await axios.post('https://jsonplaceholder.typicode.com/posts', {
			id: 117,
			title: 'test axios'
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
			completion: completion.data.text
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




