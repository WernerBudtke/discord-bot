import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	VoiceChannel,
	GuildMember,
} from 'discord.js';
import {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	AudioPlayerStatus,
	DiscordGatewayAdapterCreator,
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import ytsr from '@distube/ytsr';

export const data = new SlashCommandBuilder()
	.setName('play')
	.setDescription('Play a song from a YouTube URL or search term.')
	.addStringOption(option =>
		option
			.setName('query')
			.setDescription('The YouTube URL or search term')
			.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const query = interaction.options.getString('query', true);

	// Ensure the user is in a voice channel
	const member = interaction.member as GuildMember;
	const voiceChannel = member.voice.channel as VoiceChannel;
	if (!voiceChannel) {
		await interaction.reply('Please join a voice channel first!');
		return;
	}

	try {
		await interaction.deferReply();

		// Join the voice channel
		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild
				.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
		});

		// Handle YouTube URL or search term
		let streamUrl: string;
		if (ytdl.validateURL(query)) {
			// Direct URL
			streamUrl = query;
		} else {
			const searchResults = await ytsr(query, { limit: 1 });
			if (!searchResults.items.length) {
				await interaction.followUp('No results found for your search.');
				return;
			}

			const video = searchResults.items[0] as ytsr.Video;
			streamUrl = video.url;
		}

		// Create an audio player and resource
		const player = createAudioPlayer();
		const resource = createAudioResource(
			ytdl(streamUrl, {
				filter: 'audioonly',
				highWaterMark: 1 << 62,
				liveBuffer: 1 << 62,
				dlChunkSize: 0,
				quality: 'lowestaudio',
			})
		);
		player.play(resource);
		connection.subscribe(player);

		// Listen for playback events
		player.on(AudioPlayerStatus.Playing, () => {
			interaction.followUp(`Now playing your song! ${streamUrl}`);
		});

		player.on('error', error => {
			console.error('Error playing the stream:', error);
			interaction.followUp('There was an error playing the stream.');
		});
	} catch (error) {
		console.error('Error with /play command:', error);
		await interaction.followUp(
			'There was an error trying to play that song!'
		);
	}
}
