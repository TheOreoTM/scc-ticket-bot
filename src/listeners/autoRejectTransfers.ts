import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.MessageDelete
})
export class UserEvent extends Listener {
	// Auto reject on a message delete of a level transfer message
	public override async run(message: Message) {
		const messageId = message.id;
		const transferData = await this.container.db.levelTransfer.findUnique({
			where: {
				appealMessageId: messageId
			}
		});

		if (!transferData) return;
		message.channel.send({
			content: `Automatically rejected <@${transferData.userId}>'s request to set his level to \`${transferData.level}\` because the Transfer Request message was deleted`
		});

		return;
	}
}
