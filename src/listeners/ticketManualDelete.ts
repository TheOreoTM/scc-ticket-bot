import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Channel } from 'discord.js';

@ApplyOptions<Listener.Options>({ event: Events.ChannelDelete })
export class UserEvent extends Listener {
	public override async run(channel: Channel) {
		await this.container.db.ticket
			.deleteMany({
				where: {
					channelId: channel.id
				}
			})
			.catch(() => null);
	}
}
