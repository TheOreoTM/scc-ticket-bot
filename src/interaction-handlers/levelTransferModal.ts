import { LevelTransferStatus, NexusColors, NexusEmojis } from '#constants';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
	EmbedBuilder,
	userMention,
	type GuildTextBasedChannel,
	type ModalSubmitInteraction,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder
} from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class ModalHandler extends InteractionHandler {
	public async run(interaction: ModalSubmitInteraction<'cached'>) {
		const level = Math.round(parseInt(interaction.fields.getTextInputValue('oldlevel')));
		if (isNaN(level)) {
			interaction.reply({
				content: `${NexusEmojis.Fail} Level input should be a number`,
				ephemeral: true
			});
			return;
		}

		const hasPendingRequest = await this.container.db.levelTransfer.count({
			where: {
				userId: interaction.member.id
			}
		});

		if (hasPendingRequest === 1) {
			interaction.reply({
				content: `${NexusEmojis.Fail} You already have a pending request`,
				ephemeral: true
			});
			return;
		}

		const APPEAL_CHANNEL_ID = '915989960702709771';
		const APPEAL_CHANNEL = (await interaction.guild.channels.fetch(APPEAL_CHANNEL_ID)) as GuildTextBasedChannel;

		const embed = new EmbedBuilder()
			.setColor(NexusColors.Info)
			.setTitle('Level transfer request')
			.setAuthor({ name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL() })
			.setFields(
				{
					name: 'User requesting the level:',
					inline: true,
					value: `${userMention(interaction.member.id)} - \`${interaction.member.id}\``
				},
				{
					name: 'Level requested',
					inline: true,
					value: `\`Level ${level}\``
				}
			);

		const acceptButton = new ButtonBuilder().setStyle(ButtonStyle.Success).setLabel('Accept Request').setCustomId(`leveltransfer-accept`);
		const rejectButton = new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel('Reject Request').setCustomId(`leveltransfer-reject`);
		const message = await APPEAL_CHANNEL.send({
			embeds: [embed],
			components: [new ActionRowBuilder<ButtonBuilder>().setComponents(acceptButton, rejectButton)]
		});

		await this.container.db.levelTransfer.create({
			data: {
				level,
				appealMessageId: message.id,
				userId: interaction.member.id,
				status: LevelTransferStatus.Pending
			}
		});

		await interaction.reply({
			content: 'Thank you for submitting the form! Your request will be handled as soon as possible.',
			ephemeral: true
		});
	}

	public override parse(interaction: ModalSubmitInteraction) {
		if (interaction.customId !== 'leveltransfer') return this.none();

		return this.some();
	}
}
