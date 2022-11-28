import pathToRegexp from "path-to-regexp";
import _ from "underscore";

export default function Route(url, routes, currentUser) {
	const routeList = routes.sort((a,b) => b.path.length - a.path.length);
	const isLoggedIn = currentUser && currentUser.isLoggedIn && currentUser.isLoggedIn();
	const hasCap = perm => currentUser && currentUser.can && currentUser.can(perm);

	let routeNow, requireLogin, accessDenied;

	for(const route of routeList) {
		// If the route is already found, just bail!
		if (routeNow) {
			break;
		}

		const keys = [];
		const routePath = route.path.replace('?', '\\?');
		const parser = new pathToRegexp(routePath, keys);
		const arr = parser.exec(url);

		if (!arr) {
			continue;
		}

		// Remove the first item of the array since 
		// it's not being used
		arr.shift();

		const found = {...route, params: {}};

		// Add params from keys
		keys.map(
			(param, i) => {
				found.params[param.name] = arr[i];
			});

		// Maybe there are multiple params
		if (routePath.match('(.*)')) {
			// Get the parameters thru the remaining array
			_.extend(found.params, getParamsInQuery(url));
		}

		// Validate user
		if (route.user && 'guest' === route.user && isLoggedIn) {
			continue;
		}

		if (route.user && 'login' === route.user && !isLoggedIn) {
			requireLogin = true;
			continue;
		}

		if (route.permission) {
			const perm = _.isFunction(route.permission)
				? route.permission.call(null, found.params) 
				: route.permission;

			if (!hasCap(perm)) {
				accessDenied = true;

				continue;
			}
		}

		return found;
	}

	const list = _.indexBy(routeList, 'path');

	if (requireLogin && list['/login']) {
		// Get login route
		return list['/login'];
	}

	if (accessDenied && list['/access-denied']) {
		// Get access denied route
		return list['/access-denied'];
	}

	// Otherwise return 404 or just an empty object
	return list['/404']||{};
}

function getParamsInQuery(query) {
    const arr = query.split("?");

    if (!arr[1]) {
        return {};
    }

    const list = arr[1].split("&");

    return list
    	.reduce(
    		(p, q) => {
    			if (!q.match(/=/)) {
		            return p;
		        }

		        const q1 = q.split("=");

		        if (q1[1]) {
		            p[q1[0]] = q1[1];
		        }

		        return p;
    		},
    		p
    	);
}