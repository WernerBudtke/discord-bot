// import { generateDependencyReport } from '@discordjs/voice';
import {
	Client,
	GatewayIntentBits,
	REST,
	Routes,
	Collection,
	ClientOptions,
} from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
// console.log(generateDependencyReport()); to know if you have all the pre requirements
class ExtendedClient extends Client {
	commands: Collection<string, any>;

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Collection();
	}
}

const client = new ExtendedClient({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// Collection to store commands
client.commands = new Collection<string, any>();

// Dynamically load command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Store the command in the collection
	client.commands.set(command.data.name, command);
	// Prepare for API registration
	commands.push(command.data.toJSON());
}

// Register commands with Discord API
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
	try {
		await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
			body: commands,
		});
		console.log('Successfully registered application commands.');
	} catch (error) {
		console.error('Error registering commands:', error);
	}
})();

// Event listener for interactions
client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(
			`Error executing ${interaction.commandName} command:`,
			error
		);
		await interaction.reply({
			content: 'There was an error executing that command.',
			ephemeral: true,
		});
	}
});

client.once('ready', () => {
	console.log('Bot is online!');
});

client.login(process.env.DISCORD_TOKEN);
