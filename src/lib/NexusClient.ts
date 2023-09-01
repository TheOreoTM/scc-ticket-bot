import { ClientConfig } from '#config';
import { PrismaClient } from '@prisma/client';
import { container, SapphireClient } from '@sapphire/framework';

export class NexusClient<Ready extends boolean = boolean> extends SapphireClient<Ready> {
	public constructor() {
		super(ClientConfig);
	}

	public override async login(token?: string): Promise<string> {
		container.db = new PrismaClient();
		return super.login(token);
	}

	public override destroy(): Promise<void> {
		return super.destroy();
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		db: PrismaClient;
	}
}
