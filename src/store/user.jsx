import _ from "underscore";
import Query from "./query";

export default class User extends Query {
	notData = [
		'created',
		'updated',
		'caps',
		'meta'
	]

	constructor({
		storeKey = 'User',
		defaults = {Id: 0},
		args = {},
		fields = [
			'Id',
			'portrait',
			'email',
			'status',
			'group',
			'created',
			'meta',
			'caps'
		]
	}) {
		super({
			storeKey,
			fields,
			defaults,
			args: {
				Id: {
					type: 'String!'
				}
			}
		})
	}

	getId() {
		return this.get('Id');
	}
 
	/**
	 * Check if user has the given permission.
	 * 
	 * @param {string} perm
	 * 	The permission to check against.
	 * @returns {boolean}
	 **/
	can(perm) {
		const group = this.get('group');

		if ('administrator' === group) {
			return true; // Admins has all caps!
		}

		const caps = this.get('caps')||{};

		return caps[perm]||false;
	}

	mergeState(data) {
		const state = _.omit(data, 'meta');
		const meta = data.meta||{};

		return {...state, ...meta};
	}

	query(onSuccess = false, onError = false) {
		return {
			name: 'getUser',
			fields: this.fields,
			args: this.args,
			onSuccess: state => {
				// Reset this state
				this.reset(this.mergeState(state));

				if (onSuccess) {
					onSuccess.call(null, state);
				}
			},
			onError
		}
	}

	fetch(onSuccess = false, onError = false) {
		return this.__fetch({
			query: {
				name: 'getUser',
				fields: this.fields,
				args: this.args,
				onSuccess: state => this.mergeState(state)
			}
		}, onSuccess, onError);
	}

	update(onSuccess = false, onError = false) {
		const data = _.omit(
			this.get(),
			this.notData
		);

		return this.__post({
				query: {
					name: 'setUserData',
					fields: this.fields,
					args: {
						data: {
							type: 'Object!',
							value: data
						}
					}
				}
			}, onSuccess, onError);
	}
}