import User from "./user";

export default class CurrentUser extends User {
	constructor() {
		super({
			storeKey: 'CurrentUser',
			defaults: {Id: 0}
		});
	}

	query(onSuccess = false, onError = false) {
		return {
			name: 'getCurrentUser',
			fields: this.fields,
			onSuccess: user => {
				this.reset(this.mergeState(user));

				if (onSuccess) {
					onSuccess.call(null, this.get());
				}
			},
			onError
		}
	}

	/**
	 * Check if user is currently logged in.
	 * 
	 * @returns {boolean}
	 **/
	isLoggedIn() {
		const Id = this.getId();

		return Id && Id > 0;
	}

	/**
	 * Log user in to the server.
	 * 
	 * @param {string} usr
	 * 	The user's unique username. The same username set when registering.
	 * @param {string} pwd
	 * 	The password created while registering.
	 * @param {function} onSuccess
	 * 	Called after the user successfully logged in.
	 * @param {function} onError
	 * 	Triggered when an error occured while attempting to log in.
	 * @returns {Promise}
	 **/
	login({email, pwd}, onSuccess = false, onError = false) {
		return this
			.__post({
				query: {
					name: 'login',
					args: {
						email: {type: 'String!', value: email},
						pwd: {type: 'String!', value: pwd}
					},
					fields: this.fields
				}
			}, onSuccess, onError);
	}

	/**
	 * Logs user out from the server.
	 * 
	 * @param {function} onSuccess
	 * 	Called after the user successfully logs out.
	 * @param {function} onError
	 * 	Triggered when an error occur while attempting to log out.
	 * @returns {Promise}
	 **/
	logout(onSuccess = false, onError = false) {
		return this
			.__fetch({
				query: {name: 'logout'}
			}, onSuccess, onError);
	}

	forgotPassword(email, onSuccess = false, onError = false) {
		return this
			.__post({
				query: {
					name: 'forgotPassword',
					args: {
						email: {
							type: 'String!',
							value: email
						}
					},
					action: 'none'
				}
			}, onSuccess, onError)
	}
}