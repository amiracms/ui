import axios from "axios";
import _ from "underscore";
import {setError} from "./utils";

const DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
    'Accept': 'application/json, */*;q=0.1'
};

const configData = Object.create({});

const getHeaders = headers => {
	return _.extend(
		{},
		DEFAULT_HEADERS,
		configData.header||{},
		headers||{}
	);
}

export function configure({
	endPoint,
	host,
	headers = {},
	...others
}) {
	const data = _.pick({
		url: endPoint||'',
		header: headers,
		...others
	}, v => !!v);

	Object.assign(configData, data);

	return {...configData};
}

export function gqlGet({
	query,
	variables = {},
	headers = {}
}) {
	const queries = constructQuery(
		_.isArray(query) ? query : [query], 
		variables
	);

	return axios({
		method: "GET",
		url: configData.url,
		headers: getHeaders(headers),
		params: {
			query: `query ${queries}`,
			variables
		}
	})
	.then(res => handleResponse(res, query));
}

export function gqlPost({
	query,
	variables = {},
	name,
	files,
	headers = {}
}) {
	const queries = constructQuery(_.isArray(query) ? query : [query], variables);
	const _headers = getHeaders(headers);

	let data;

	if (files && files.length > 0) {
		const formData = new FormData();

		for(const file of files) {
			formData.append(name, file, file.name);
		}

		data = formData;
		_headers["Content-Type"] = "multipart/form-data; boundary=" + (new Date()).getTime();
	}

	return axios({
		method: "POST",
		url: configData.url,
		headers: _headers,
		params: {
			query: `mutation ${queries}`,
			variables: variables
		},
		data
	})
	.then(res => handleResponse(res, query));
}

function constructQuery(queries, vars) {
	const def = [];
	const queryList = queries.map(
		({alias, name, args, fields}) => {
			const queryString = [name];

			if (args) {
				// Get the arguments and argument definition
				queryString.push(getArgs({alias, name, args, vars, def}));
			}

			if (fields) {
				const fieldString = _.isArray(fields) ? fields.join(' ') : fields;
				queryString.push(`{${fields}}`);
			}

			if (alias) {
				return `${alias}: ${queryString.join(' ')}`;
			}

			return `${name}: ${queryString.join(' ')}`;
		}
	);

	if (def && def.length > 0) {
		return `WRAPPER(${def.join(' ')}) {${queryList.join(' ')}}`;
	}

	return `{${queryList.join(' ')}}`;
}

function getArgs({alias, name, args, vars, def}) {
	const queryArgs = Object.entries(args)
		.map(
			([key, {type, value}]) => {
				if (_.isFunction(value)) {
					value = value.call(null);
				}

				if (!value) {
					return;
				}

				if (type.match(/Int/)) {
					value = parseInt(value);
				}

				if (type.match(/String/)) {
					value = new String(value);
				}

				const keyName = alias ? `${alias}_${key}` : `${name}_${key}`;

				// Add the
				vars[keyName] = value;

				// Add definition
				def.push(`$${keyName}: ${type}`);

				return `${key}: $${keyName}`;
			}
		)
		.filter(v => !!v);

	if (!queryArgs.length) {
		return '';
	}

	return `(${queryArgs.join(' ')})`;
}

function handleResponse(res, query) {
	if (res.errors) {
		return setError(
			'Something went wrong. Unable to process the request!',
			'server_error'
		);
	}

	const data = res.data.data;
	const error = res.data.error;

	// For single query
	if (query.name) {
		const name = query.alias||query.name;

		if (error[name]){
			if (query.onError) {
				return query.onError.call(null, error[name]);
			}

			throw setError(error[name]);
		}

		if (query.onSuccess) {
			return query.onSuccess.call(null, data[name]);
		}

		return {state: data[name], action: query.action};
	}

	query.map(
		({alias, name, onSuccess, onError}) => {
			const keyName = alias || name;

			if (data[keyName]) {
				return onSuccess && onSuccess.call(null, data[keyName]);
			}

			if (error && error[keyName]) {
				return onError && onError.call(null, error[keyName]);
			}
		});

	return {action: 'none'};
}