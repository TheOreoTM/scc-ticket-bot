import { NexusColors, NexusEmojis } from '#constants';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, type GuildTextBasedChannel } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Send the pre-made ticket creation embed (ask oreo to edit it)',
	runIn: ['GUILD_ANY'],
	requiredUserPermissions: ['Administrator']
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addChannelOption((option) =>
					option //
						.setName('channel')
						.setDescription('The channel you want to send the ticket embed to.')
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const guild = interaction.guild!;
		const channel = interaction.options.getChannel('channel', true) as GuildTextBasedChannel;

		const createTicketButton = new ButtonBuilder()
			.setLabel('Create Ticket')
			.setEmoji('📩')
			.setStyle(ButtonStyle.Secondary)
			.setCustomId('ticketCreate');

		const embed = new EmbedBuilder()
			.setTitle(`${guild.name} | Support Ticket`)
			.setDescription('To get support ticket click the button with 📩 to create a ticket.')
			.setColor(NexusColors.Default)
			.addFields(
				{
					name: 'You can create a ticket for:',
					value: `
					- Reporting members for breaking rules\n
					- Reporting staff members\n
					- Appealing a punishment\n
					-Other server related support`
				},
				{
					name: 'Before creating a ticket...',
					value: `
					- Make sure you have read <#708949525670133800> if you're confused on why you can't do a certain thing like posting images/sticker etc...\n
					- Read <#915716486822248539> if you're gonna apply for staff.\n
					- Ask yourself if creating a ticket is actually necessary for that situation.
					`
				},
				{
					name: 'Guidelines',
					value: `
					Create tickets solely for a purpose
					Do not press the **[CREATE TICKET]** button for no reason. If you are found doing this you will be warned.`
				},
				{
					name: 'IMPORTANT: Dont ask to ask',
					value: `
					When you create a ticket dont just say "hey" or "i need help" and then wait till a staff member replies. This only prolongs the time that it takes for you to receive an answer. Instead open a ticket and type in what you need help with.
					Refer to <https://dontasktoask.com/> and <https://nohello.net/>.`
				}
			);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(createTicketButton);

		await channel.send({ embeds: [embed], components: [row] });

		return interaction.reply({
			ephemeral: true,
			content: `${NexusEmojis.Success} Sent embed to ${channel}`
		});
	}
}
