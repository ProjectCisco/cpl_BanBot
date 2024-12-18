import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import fs from 'node:fs'
import path from 'node:path'

import { config } from './config'
import { deploy } from './deploy'
import { connectToMongoDB } from 'util/mongo'
import PunishmentHandler from 'util/punishmentHandler'

const client: any = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
})

client.commands = new Collection()

const foldersPath = path.join(__dirname, './commands')
const commandFiles = fs
  .readdirSync(foldersPath)
  .filter((file) => file.endsWith('.ts'))
for (const file of commandFiles) {
  const filePath = path.join(foldersPath, file)
  const command = require(filePath)
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command)
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    )
  }
}

const eventsPath = path.join(__dirname, 'events')
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith('.ts'))

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file)
  const event = require(filePath)
  if (event.once) {
    client.once(event.name, (...args: any) => event.execute(...args))
  } else {
    client.on(event.name, (...args: any) => event.execute(...args))
  }
}

// Initialize MongoDB connection and PunishmentHandler
(async () => {
  await connectToMongoDB();     
  const punishmentHandler = new PunishmentHandler();
})();

client.login(config.token);
deploy();