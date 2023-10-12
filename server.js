import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { configDotenv } from 'dotenv'
import OpenAI from "openai"
configDotenv()

const app = express()
const port = 3000
const URL = 'https://dnd-dwarves.netlify.app/.netlify/functions/bot'

app.use(cors())
app.use(express.json())

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
})

async function getCompletion(messages) {
	const completion = await openai.chat.completions.create({
		messages: messages,
		model: 'gpt-3.5-turbo'
	})
	return completion
}

// ==================================

app.get('/test', async (req, res) => {
	res.send('Hello World!')
	const response = await axios.post('https://jsonplaceholder.typicode.com/posts', { id: 117, title: 'test axios' })
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
			completion: completion.choices[0].message.content
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




