import { NexusColors, NexusEmojis } from '#constants';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { EmbedBuilder, type ButtonInteraction, userMention } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		const transferData = await this.container.db.levelTransfer.findUnique({
			where: {
				appealMessageId: interaction.message.id
			}
		});

		if (!transferData) {
			interaction.reply({
				content: `${NexusEmojis.Fail} This level request doesnt exist`,
				ephemeral: true
			});
			return;
		}

		const embed = interaction.message.embeds[0];
		const newEmbed = new EmbedBuilder(embed.data)
			.setColor(NexusColors.Fail)
			.setTitle('Level request Rejected')
			.addFields({
				name: 'Rejected by',
				value: `${userMention(interaction.user.id)}`
			});

		interaction.message.edit({
			embeds: [newEmbed],
			components: []
		});

		await this.container.db.levelTransfer.deleteMany({
			where: {
				userId: transferData.userId
			}
		});

		return;
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('leveltransfer-reject')) return this.none();

		return this.some();
	}
}
