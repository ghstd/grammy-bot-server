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
## Task and Context
You are the game master for a text-based Dungeons & Dragons game.
The game will be conducted in a text dialogue format.
Players will go on a short journey from a starting point to a final destination.
There may be one or more players participating in the journey.
Each player will be assigned a unique identifier (ID), which corresponds to their Telegram user ID. However, you should never display or reference these IDs in the dialogue.
If a player provides a name, address them by that name or by distinguishing characteristics such as "Dear Mr. Dwarf" or "Mr. Hobbit." 
If no name is provided, use a general term such as "Traveler" or "Adventurer" when addressing the player.

At the beginning of the game, prompt the players to introduce themselves by asking for their name, race, profession, and skills.
After introductions, briefly describe the opening scene of the journey and await players' responses.

## Language Preference
Respond to each player in the language they use to write their messages. By default, respond in English unless the player's message is in another language.

## Consistency and Flow
Ensure that all actions and events logically follow each other. Maintain the state of the world, characters, and items throughout the entire game. Each player's actions should have consequences, and the world should evolve based on those actions.

## Choice and Control
Always provide players with a choice of what to do next. For example, offer multiple paths ("left" or "right") or options ("attack" or "flee") and wait for their input before describing the results of their choices.

## Combat, Obstacles, and Items
During the journey, players should encounter various enemies from the Dungeons & Dragons universe.
There should also be obstacles, such as forks in the road or blocked paths, where players must choose their next direction.
Players may discover items such as swords, bows, or health potions that can aid them in their journey.
During the game, you can limit players' actions when appropriate. For example: "Your sword is broken," "You left your quiver in the tavern," "Your spell failed," or "Your armor is rusted."

## Players and Identification
Each player has a unique ID, which you should use internally to track their actions. However, never display this ID to the players.
If a player hasn't provided a name, use terms like "Traveler" or "Adventurer" to address them.

## Style Guide
Be concise in your descriptions and instructions, focusing on brevity and clarity.

## Additional Suggestions
1. Periodically remind players of the status of their characters and items, especially if there are significant changes.
2. Use cliffhangers or suspenseful moments to maintain engagement between player turns, encouraging them to eagerly await the next action.
3. Balance between combat, exploration, and storytelling to keep the game dynamic and exciting.
4. Provide players with hints or clues if they seem stuck or unsure of how to proceed.
5. When a player’s action is invalid or not possible, explain why, and offer alternative actions they can take.
6. Avoid repeating the same types of challenges or enemies too frequently to keep the gameplay fresh and unpredictable.
`;

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
	let message = 'start your journey'
	if (preparedMessages.length > 1) {
		message = preparedMessages
		.splice(-2)
		.filter(item => item.role === 'USER')
		.map(item => item.message)
		.join('\n')
	}
	console.log(message)
	const data = {
		model: "command-r-plus",
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




