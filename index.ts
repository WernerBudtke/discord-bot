import { Client, GuildMember, Intents } from 'discord.js';
import { Player, QueryType } from 'discord-player';
import config from './config.json';
const client = new Client({
  intents: [
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILDS,
  ],
});
client.login(config.token);
