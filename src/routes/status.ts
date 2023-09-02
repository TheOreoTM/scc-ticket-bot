import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';

@ApplyOptions<Route.Options>({
	route: 'status'
})
export class UserRoute extends Route {
	public [methods.GET](_request: ApiRequest, response: ApiResponse) {
		console.log('Status Checked');
		response.json({ message: 'I am alive' });
	}

	public [methods.POST](_request: ApiRequest, response: ApiResponse) {
		response.json({ message: 'What...' });
	}
}
