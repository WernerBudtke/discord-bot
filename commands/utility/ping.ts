/* eslint-disable @typescript-eslint/no-explicit-any */
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!');
export async function execute(interaction: any) {
  await interaction.reply('Pong!');
}
