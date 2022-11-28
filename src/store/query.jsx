import _ from "underscore";
import Store from "./";

export default class Query {
	#store

	#defaultArgs

	args = {}

	constructor({
		storeKey,
		defaults,
		fields = [],
		itemFields,
		args = {}
	}) {
		const queryFields = fields.map(
			f => {
				if ('items' === f && itemFields) {
					return `items {${itemFields}}`
				}
				return f;
			});

		this.#store = Store({
			name: storeKey,
			initialState: defaults
		});
		this.store = this.#store.store;
		this.__fetch = this.#store.fetch;
		this.__post = this.#store.post;
		this.fields = queryFields;
		this.itemFields = itemFields;
		this.#defaultArgs = JSON.parse(JSON.stringify(args));
		this.args = {...args};
		this.storeKey = storeKey;
	}

	setArgs(args) {
		for(const [name, value] of Object.entries(args)) {
			if (this.args[name]) {
				this.args[name].value = value;
			}
		}
	}

	resetArgs(args) {
		Object
			.entries(this.#defaultArgs)
			.map(
				([name, data]) => {
					this.args[name].value = args[name]||data.value;
				}
			)
	}

	getArg(name) {
		return this.args[name] && this.args[name].value;
	}

	get(name) {
		return this.#store.getState(name);
	}

	set(name, value) {
		return this.#store.setState(name, value);
	}

	reset(state) {
		return this.#store.resetState(state);
	}
}