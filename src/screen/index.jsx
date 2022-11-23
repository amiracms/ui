import _ from "underscore";
import Store from "../store";
import {configure} from "../gql";
import Route from "./route";

export default new class Screen {
	#store = Store({name: 'Screen', serialize: false})

	#config = {}

	#actions = []

	#filters = []

	#queries = {}

	#routes = {}

	get(name) {
		return this.#store.getState(name);
	}

	configure(config) {
		this.#config = configure(config);
	}

	/**
	 * Adds action listener on the given action name.
	 * 
	 * @param {string} action
	 * 	The name of the action event where the listener listens to.
	 * @param {function} callback
	 * 	The function to execute when the action event is triggered.
	 * @return {function}
	 * 	Returns a function to would remove the hook from the listeners.
	**/
	on(action, callback) {
		if (!this.#actions[action]) {
			this.#actions[action] = [];
		}

		this.#actions[action].push(callback);

		return () => {
			const pos = this.#actions[action].length - 1;

			this.#actions[action] = this.#actions[action].filter((c, i) => i !== pos);
		}
	}

	/**
	 * Calls and execute all listeners of the given action name.
	 * 
	 * @param {string} name
	 * 	The name of the action hook.
	 * @return {*}
	 **/
	trigger(action, ...args) {
		const list = this.#actions[action];

		if (!list) {
			return;
		}

		return list
			.reduce(
				(p, f) => f.call(null, ...args),
				args
			);
	}

	/**
	 * Add listener to the given filter name.
	 * 
	 * @param {string} name
	 * 	The name of the filter the listener listens to.
	 * @param {function} callback
	 * 	The function to execute when the filter is called.
	 * 	Note that the callback should return the value of the filtered data.
	 * @return {Function}
	 * 	Returns a function that will remove the filter hook from the list.
	**/
	filter(filter, callback) {
		if (!this.#filters[filter]) {
			this.#filters[filter] = [];
		}

		this.#filters[filter].push(callback);

		return () => {
			const pos = this.#filters[filter].length -1;

			this.#filters[filter] = this.#filters[filter].filter((f, i) => i !== pos);
		}
	}

	/**
	 * Calls and apply all listeners to the given filter name.
	 * 
	 * @param {string} name
	 * 	The name of the filter where the listeners listens to.
	 * @param {*} value
	 * 	The data to filter.
	 * @param ...
	 * 	Any additional arguments to satisfy the filter listeners.
	 * @return {*}
	 * 		Returns the filtered value.
	 **/
	applyFilters(filter, value, ...args) {
		const list = this.#filters[filter];

		if (!list) {
			return value;
		}

		return list
			.reduce(
				(p, f) => f.call(null, p, ...args),
				value
			);
	}

	/**
	 * Sets route path which handles the screen content when loaded.
	 * 
	 * @param {string|array} path
	 * 	The relative path of the screen or the list of relative path.
	 * @param {string|function} title
	 * 	The screen title. If a function, it the return value must be a string
	 * 	which sets the route title.
	 * @param {string} description
	 * 	The short screen description.
	 * @param {string} typeNow
	 * 	The unique type name of the screen.
	 * @param {string|Object|Function} pageNow
	 * 	The page content of the screen. Also use as the default content
	 * 	if there's content is not set.
	 * @param {string|object|function} content
	 * 	Use to set the content inside the main content, if set. If no main content
	 *  `pageNo` is set then it will be use as the screen content instead.
	 * @param {string} user
	 * 	Optional. The type of user able to view the content. Options are `guest`|`login`
	 * 	If omitted, the screen becomes viewable to any type of user.
	 * @param {string|function} permission
	 * 	Optional. The type of permission the current user must have to be able to view 
	 * 	the content of the screen.
	 * 	If the value is a function, then the function must return a string.
	 **/
	routePath({
		path,
		title,
		description,
		typeNow,
		pageNow,
		content,
		user,
		permission
	}) {
		const client = this.isAdmin() ? 'admin' : this.#config.client;
		
		path = _.isArray(path) ? path : [path];

		path.map(
			route => {
				this.#routes.push({
					path: route,
					title,
					description,
					typeNow,
					pageNow,
					content,
					user,
					permission,
					client
				});
			}
		);
	}

	/**
	 * Sets GraphQL Get request to the server.
	 * 
	 * @param {string} alias
	 * 	A unique alias name to wrap the gql query name.
	 * @param {string} name
	 * 	The gql query name. Must be the same as the query name set in the server.
	 * @param {object<{type: String, value: *}>} args
	 * 	Defines the arguments which corresponds to the query defined on the server.
	 * @param {array<String>} fields
	 * 	The list of return field data.
	 * @param {function} onSuccess
	 * 	Called after succesful data retrieval.
	 * @param {function} onError
	 * 	Called when the query failed.
	 * @return {void}
	 **/
	gql({
		alias,
		name,
		args,
		fields,
		onSuccess,
		onError
	}) {
		this.#queries.push({alias, name, args, fields, onSuccess, onError});
	}

	#shouldLoad(url) {
		if (!url.match(/http/)) {
			// Same url, return
			return false;
		}

		const host = this.#config.host;
		const pattern = new RegExp(`^${host}`);

		return url.match(pattern) ? true : false;
	}

	/**
	 * Loads new screen when applicable.
	 * 
	 * @param {string} url
	 * 	The url of the screen to load to.
	 * @param {boolean} force
	 * 	Whether to reload the current screen.
	 * @return {void}
	 **/
	load(url, force = false) {
		const currentUrl = this.get('url');

		if (currentUrl === url && !force) {
			// Do nothing
			return;
		}

		// If it is a third party url, just load it
		if (this.#shouldLoad(url)) {
			if (this.refreshBrowser) {
				this.refreshBrowser(url);
			}

			return;
		}

		const route = {
			...Route(url, this.#routes, this.CurrentUser),
			url,
			oldUrl: currentUrl,
			name: this.#config.name,
			tagline: this.#config.tagline
		};

		/**
		 * Verify if the screen does not contain any restrictions
		 * as it navigates to a different screen.
		 * 
		 * @param {boolean} leave
		 * 	Whether is should leave naviate forward. Default is true.
		 * @param {object} route
		 * 	The new route data properties to navigate unto.
		 * @param {object} current
		 * 	The current loaded route data properties.
		 * @return {boolean}
		 **/
		const shouldLeave = this.applyFilters(
			'screen/leave',
			true,
			route,
			this.get()
		);

		if (!shouldLeave) {
			return;
		}

		/**
		 * Triggered whenever the screen is about to change.
		 * 
		 * @param {object} route
		 * 	The data properties of the screen about to leave.
		 **/
		this.trigger('screen/exited', this.get());

		// Accept new queries
		this.canQuery = true;

		this.#store.resetState(route);

		/**
		 * Triggered whenever a new screen enters.
		 * 
		 * @param {object} route
		 * 	The data properties of the new screen.
		 **/
		this.trigger('screen/enter', route);

		// If browser able to reset the url, change it
		if (this.setBrowserUrl) {
			this.setBrowserUrl(route.url);
		}
	}

	/**
	 * Sends the list of gql queries to the server.
	 * 
	 * @returns {Promise<void>}
	 **/
	fetch() {
		if (!this.#queries.length) {
			return Promise.resolve(true);
		}

		return this.#store
			.fetch(
				{query: this.#queries},
				() => {this.#queries = []},
				() => {this.#queries = []}
			);
	}
}