import { NexusColors, NexusEmojis } from '#constants';
import { isStaff } from '#lib/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { EmbedBuilder, type ButtonInteraction, userMention } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction<'cached'>) {
		const ticketId = Number(interaction.customId.split('-')[1]);

		if (!isStaff(interaction.member)) {
			interaction.reply({
				content: `${NexusEmojis} You cant use this button`,
				ephemeral: true
			});
			return;
		}

		const ticketData = await this.container.db.ticket.findUnique({
			where: {
				id: ticketId
			}
		});

		if (!ticketData) {
			interaction.reply({ ephemeral: true, content: `${NexusEmojis.Fail} I cant find this ticket` });
			return;
		}

		const ticketOwnerId = ticketData.ownerId;

		await this.container.db.blacklist.create({
			data: {
				userId: ticketOwnerId
			}
		});

		interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(NexusColors.Success)
					.setDescription(`${userMention(interaction.user.id)} has blocked ${userMention(ticketOwnerId)} from tickets`)
			]
		});

		return;
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('ticketBlock')) return this.none();

		return this.some();
	}
}
