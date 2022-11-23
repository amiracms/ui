import {
	configureStore, 
	createSlice, 
	createAsyncThunk
	} from "@reduxjs/toolkit";
import {useDispatch} from "react-redux";
import _ from "underscore";
import {gqlGet, gqlPost} from "../gql";

export function Slicer(name, initialState = {}) {
	const get = createAsyncThunk(`${name}/get`, gqlGet);
	const post = createAsyncThunk(`${name}/post`, gqlPost);

	const onPending = state => {}

	const onError = (state, {error}) => {}

	const onSuccess = (state, {payload}) => {}

	const slicer = createSlice({
		name,
		initialState: {
			status: 'idle',
			error: null,
			state: initialState
		},
		reducers: {
			setStatus(state, {payload}) {
				const {status, error} = payload;

				return {
					...state,
					status,
					error
				};
			},

			setState(state, {payload}) {
				const {name, value} = payload;
				const isArray = _.isArray(state.state);

				// Assumes the state is in array format
				// Value is not in use for array type of state
				if (isArray) {
					if (_.isArray(name)) {
						state.state = [...state.state, ...name];

						return state;
					}

					state.state.push(name);

					return state;
				}

				if (_.isObject(name)) {
					// Merge the object to the state
					state.state = {...state.state, ...name};

					return state;
				}

				state.state[name] = value;

				return state;
			},

			unsetState(state, {payload}) {
				return {
					...state,
					state: {
						...state.state,
						[payload]: null
					}
				};
			},

			resetState(state, {payload}) {
				return {
					...state,
					state: payload,
					status: 'done',
					error: null
				}
			}
		},
		extraReducers(builder) {
			builder
				.addCase(get.pending, onPending)
				.addCase(get.rejected, onError)
				.addCase(get.fulfilled, onSuccess)
				.addCase(post.pending, onPending)
				.addCase(post.rejected, onError)
				.addCase(post.fulfilled, onSuccess);
		}
	});

	return {get, post, reducer: slicer.reducer, actions: slicer.actions};
}

export default function Store({
	name,
	initialState = {},
	slicer,
	serialize = true
}) {
	// Maybe create slicer?
	slicer = slicer || Slicer(name, initialState);

	const config = {reducer: slicer.reducer};

	if (!serialize) {
		config.middleware = 
			(getDefaultMiddleWare) => 
				getDefaultMiddleWare({serializableCheck: false});
	}

	const store = configureStore(config);
	const {setState, setStatus, unsetState, resetState} = slicer.actions;

	return {
		store,

		subscribe: store.subscribe,
		
		/**
		 * Get the value of the given state name. If name is omitted then
		 * the return value will be the entire state.
		 * 
		 * @param {string} name
		 * @returns {*}
		 **/
		getState(name) {
			const allState = store.getState();
			const state = allState.state;

			if (name) {
				return state[name];
			}

			return state;
		},

		/**
		 * Add property to the store state.
		 * 
		 * @param {string|object|array} name
		 *  The name of the state to add to or an object or list of object to
		 *  add to the state.
		 * @param {*} value
		 *  Optional. The corresponding value of the given state name.
		 * @returns {void}
		 **/
		setState: (name, value) => store.dispatch(setState({name, value})),

		unsetState: name => store.dispatch(unsetState(name)),

		/**
		 * Reset the store state.
		 * 
		 * @param {object|array} state
		 *  The new state to set to.
		 * @returns {void}
		 **/
		resetState: state => store.dispatch(resetState(state)),

		/**
		 * Sends graphql GET request to the server.
		 * 
		 * @param {object} query
		 * @param {function} onSuccess
		 * @param {function} onError
		 * @returns {Promise}
		 **/
		async fetch(query, onSuccess = false, onError = false) {
			await store.dispatch(slicer.get(query));

			const state = store.getState();

			if ('error' === state.status) {
				if (onError) {
					return onError.call(null, state.error);
				}
				
				throw state.error;
			}

			return onSuccess && onSuccess.call(null, state.state)|| state.state;
		},

		async post(query, onSuccess = false, onError = false) {
			await store.dispatch(slicer.post(query));

			const state = store.getState();

			if ('error' === state.status) {
				if (onError) {
					return onError.call(null, state.error);
				}

				throw state.error;
			}

			return onSuccess && onSuccess.call(null, state.state) || state.state;
		}
	};
}