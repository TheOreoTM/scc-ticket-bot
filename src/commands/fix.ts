import { NexusColors, NexusEmojis } from '#constants';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationCommandType, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'fix a bugged user'
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addUserOption((option) =>
					option //
						.setName('member')
						.setDescription('The member that you want to fix')
						.setRequired(true)
				)
		);

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: 'Fix',
			type: ApplicationCommandType.User
		});
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await this.sendSuccessMessage(interaction);
		return this.fixUser(interaction.options.getUser('member', true).id);
	}

	// Context Menu command
	public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		await this.sendSuccessMessage(interaction);
		return this.fixUser(interaction.targetId);
	}

	private async sendSuccessMessage(interaction: Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction) {
		interaction.reply({
			embeds: [new EmbedBuilder().setColor(NexusColors.Success).setDescription(`***${NexusEmojis.Success} Unblocked member successfully***`)]
		});
	}

	private async fixUser(userId: string) {
		await this.container.db.ticket.deleteMany({
			where: {
				ownerId: userId
			}
		});
	}
}
