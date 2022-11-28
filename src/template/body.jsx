import React, {useEffect} from "react";
import {Provider, useSelector} from "react-redux";
import Screen from "../screen";
import renderElement from "./render";

export default function Body({children}) {
	const {typeNow, pageNow, client} = useSelector(state => state.state);

	useEffect(
		() => {
			// Fetch if there's any queries set
			// Some queries are added via components
			Screen
				.fetch()
				.then(
					() => {
						/**
						 * Triggered whenever the screen is fully loaded.
						 * 
						 * @param {string} typeNow
						 * 	The type of screen to displayed at.
						 * @param {string} client
						 * 	Either `admin` or `client` the screen is.
						 **/
						Screen.trigger('screen/entered', typeNow, client);

						// Mark as cannot query
						Screen.canQuery = false;
					}
				);

			return () => {
				/**
				 * Trigger whenever the body content exited
				 * 
				 * @param {string} typeNow
				 * 	The screen type that exited.
				 * @param {string} client
				 * 	The type of screen currently loaded. (i.e. admin, client)
				 **/
				 Screen.trigger('screen/exited', typeNow, client);
			};
		}
	);

	const template = renderElement({templateId: pageNow, defaultTemplateId: '/index'});

	return template||children;
}