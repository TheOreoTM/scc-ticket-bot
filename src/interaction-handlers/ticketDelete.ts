import { NexusEmojis } from '#constants';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction, TextChannel } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction) {
		const channel = interaction.channel as TextChannel;

		if (channel.deletable) {
			await channel.delete();
		} else {
			channel.send({ content: `${NexusEmojis.Fail} I can't delete this channel.` });
		}
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId !== 'ticketDelete') return this.none();

		return this.some();
	}
}
