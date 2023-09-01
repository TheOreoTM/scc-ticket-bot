import { NexusColors, NexusEmojis, TicketConfig, TicketState } from '#constants';
import { generateTranscript, setTicketState, wait } from '#lib/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
	ButtonBuilder,
	ButtonStyle,
	type ButtonInteraction,
	ActionRowBuilder,
	ComponentType,
	EmbedBuilder,
	TextChannel,
	userMention
} from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		const channel = interaction.channel! as TextChannel;

		const ticketId = parseInt(interaction.customId.split('-')[1]);

		const ticketData = await this.container.db.ticket.findUnique({
			where: {
				id: ticketId
			}
		});

		if (!ticketData) {
			return channel.deletable
				? await channel.delete()
				: await interaction.channel?.send({
						content: `${NexusEmojis.Fail} This channel isnt in my database and i cant delete this channel, ask an admin to delete this channel manually.`
				  });
		}

		const closeButton = new ButtonBuilder().setCustomId(`ticketConfirmClose-${ticketId}`).setLabel('Close').setStyle(ButtonStyle.Secondary);
		const cancelButton = new ButtonBuilder().setCustomId(`ticketCancelClose-${ticketId}`).setLabel('Cancel').setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton, cancelButton);

		const response = await interaction.reply({
			ephemeral: true,
			content: 'Are you sure you would like to close this ticket?',
			components: [row]
		});

		await response.awaitMessageComponent({ time: 60_000, componentType: ComponentType.Button }).then(async (interaction) => {
			if (interaction.customId === `ticketConfirmClose-${ticketId}`) {
				channel.send({
					embeds: [
						new EmbedBuilder()
							.setColor(NexusColors.Warn)
							.setDescription(`Ticket closed by ${interaction.user}. And ticket will be deleted in \`5 seconds\``)
					]
				});

				await setTicketState(ticketData.id, TicketState.Closed);
				channel.permissionOverwrites.edit(ticketData.ownerId, { ViewChannel: false });

				// const ticketDeleteButton = new ButtonBuilder()
				// 	.setStyle(ButtonStyle.Secondary)
				// 	.setLabel('Close')
				// 	.setEmoji('🔒')
				// 	.setCustomId(`ticketClose-${ticketData.id}`);

				const transcript = await generateTranscript(channel);
				const transcriptChannel = interaction.guild?.channels.cache.get(TicketConfig.TranscriptChannel) as TextChannel;
				const ticketOwner = this.container.client.users.cache.get(ticketData.ownerId);
				const transcriptEmbed = new EmbedBuilder()
					.setAuthor({
						name: ticketOwner?.username ?? 'Dummy#0000',
						iconURL: ticketOwner?.displayAvatarURL({ forceStatic: true })
					})
					.addFields(
						{
							name: 'Ticket Owner',
							value: userMention(ticketData.ownerId)
						},
						{
							name: 'Ticket Name',
							value: channel.name
						},
						{
							name: 'Ticket Type',
							value: `\`${ticketData.type}\``
						}
					);

				transcriptChannel.send({
					files: [transcript],
					embeds: [transcriptEmbed]
				});

				await wait(5000);

				if (channel.deletable) {
					await setTicketState(ticketData.id, TicketState.Closed);
					return await channel.delete();
				}

				return channel.send({ content: `${NexusEmojis.Fail} I can't delete this channel.` });
			}

			if (interaction.customId === `ticketCancelClose-${ticketId}`) {
				return response.delete();
			}

			return;
		});

		return;
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('ticketClose')) return this.none();

		return this.some();
	}
}
