import { NexusColors, NexusEmojis } from '#constants';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { EmbedBuilder, type ButtonInteraction, userMention } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public async run(interaction: ButtonInteraction<'cached'>) {
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

		const body = {
			amount: transferData.level,
			staff_id: interaction.member.id
		} satisfies LevelTransferBody;

		console.log(body);

		const response = await fetch(`https://skitty.oreotm.xyz/levels/${transferData.userId}`, {
			headers: {
				Authorization: `Bearer ${process.env.API_KEY}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(body)
		});
		const data = await response.json();

		if (data.message !== 'success') {
			interaction.reply({
				content: `${NexusEmojis.Fail} Something went wrong\n\nSource: \`\`\`json\n${JSON.stringify(data, null, 2)}\`\`\``,
				ephemeral: true
			});
			return;
		}
		await interaction.reply({
			content: `${NexusEmojis.Success} Set \`${transferData.userId}\` level to \`${transferData.level}\``,
			ephemeral: true
		});
		const embed = interaction.message.embeds[0];
		const newEmbed = new EmbedBuilder(embed.data)
			.setColor(NexusColors.Success)
			.setTitle('Level request Accepted')
			.addFields({
				name: 'Accepted by',
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
		if (!interaction.customId.startsWith('leveltransfer-accept')) return this.none();

		return this.some();
	}
}

type LevelTransferBody = {
	amount: number;
	staff_id: string;
};
