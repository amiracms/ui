import React from 'react';
import {createRoot} from 'react-dom/client';
import {createBrowserHistory} from 'history';
import {Provider} from "react-redux";
import Screen from "./screen";
import $dom from "./dom";
import Body from "./template/body";

const browserHistory = createBrowserHistory();
 
// Record every visited page
browserHistory.listen(function reloadHistory({location, action}) {
    if ('POP' !== action) {
        return;
    }
    
    Screen.load(location.pathname);
});

// Reload screen
Screen.refreshBrowser = url => window.location.assign(url);

// Change browser url without reloading
Screen.setBrowserUrl = url => browserHistory.push(url);

export default function BrowserConfig(
	config, 
	docRoot = 'doc-root',
	Index,
	onError = _onError
) {
	// Set configuration
	Screen.configure(config);

	// Change document details
	Screen.on('screen/entered', updateDocument);

	// Fetch primary requests
	Screen
		.fetch()
		.catch(onError)
		.then(() => onSuccess(docRoot, Index));
}

function updateDocument() {
	const {
		name, 
		typeNow, 
		title, 
		tagline, 
		description, 
		user,
		client
	} = Screen.get();

	const isAdmin = 'admin' === client;
	const _class = [isAdmin ? 'admin' : '', typeNow];

	if ('guest' === user) {
		_class.push('guest');
	}

	const classes = Screen.applyFilters(
		isAdmin ? 'admin_body_class' : 'body_class',
		_class
	);

	$dom('body')
		.attr('class', classes.filter(v => !!v).join(' '));

	// Update document title
	const docTitle = title ? (title + ' - ' + name) : (name + ' - ' + tagline);

	// Change document title
	window.document.title = docTitle;
}

function onSuccess(docRoot, Index) {
	/**
	 * Triggered whenever a the screen is loaded.
	 **/
	Screen.trigger('screen/init');

	// Display screen
	const doc = document.getElementById(docRoot);
	const root = createRoot(doc);

	root.render(
		<>
			<Provider store={Screen.store.store}>
				{Index ? (
					<Body>
						{Index}
					</Body>
				) : (<Body/>)}
			</Provider>
		</>
	);

	Screen.load(window.location.pathname);
}

function _onError(err) {
	// Do something with the error
}