import React from "react";
import _ from "underscore";
import parseHTML from "../parser";
import Screen from "../screen";

// Store parsed templates
const templates = {};

export function getTemplate(templateId) {
	const list = Screen.config('templates')||[];

	if (!list[templateId]) {
		return null;
	}

	if (!templates[templateId]) {
		templates[templateId] = parseHTML(list[templateId]);
	}

	return templates[templateId];
}

export function iterateChildren(children, dataList) {
	return React.Children.map(
		children, 
		child => {
			if (!React.isValidElement(child)) {
				// Just return it
				return child;
			}

			const props = transformData({...child.props}, dataList);
			const type = child.type;
			const name = type.name||type;

			if (_.isFunction(type)) {
				if ('If' === name) {
					// Add data list as state
					props.state = dataList;
				}

				return React.cloneElement(child, props);
			}

			if (dataList && dataList[name] && _.isFunction(dataList[name])) {
				return dataList[name].call(
					null, 
					React.cloneElement(child, props));
			}

			if (props.children) {
				props.children = iterateChildren(child.props.children, dataList);
			}

			// Change <a> element here
			if ('a' === name 
				&& props.url
				&& !Screen.isSameSite(props.url)
				&& !props.onClick) {
				props.onClick = () => Screen.load(props.url);
			}

			return React.createElement(type, props);
		})
}

export function transformData(props, dataList) {
	if (!dataList || _.isEmpty(dataList)) {
		return props;
	}

	return Object
		.entries(props)
		.reduce(
			(p, [name, value]) => {
				if (name.match(/@data-/)) {
					const n = name.replace(/^@data-/, '');
					// Remove the attribute
					p = _.omit(p, name);

					if (dataList[n]) {
						p = {...p, ...dataList[n]};
					}

					return p;
				}

				if (_.isObject(value) 
					|| _.isFunction(value)
					|| 'children' === name
					|| !value.match
					|| !value.match(/@data-|@lang-|@screen-/g)) {
					// Just return it
					return p;
				}

				const values = value.split(' ')
					.map(
						v => {
							if (!v || !v.match) {
								return v;
							}

							if (v.match(/@data-/)) {
								return v.replace(
									/@data-.?[^& ]*/gi, 
									x => {
										const n = x.replace(/@data-/, '');

										return dataList[n];
									});
							}

							if (v.match(/@lang-/)) {
								return v.replace(/@data-.?[^& ]*/gi, x => dataList[x]);
							}

							return v;
						})
					.filter(v => !!v);

				p[name] = values.join(' ');

				return p;
			},
			{...props}
		);
}

export default function renderElement({
	children,
	templateId,
	defaultTemplateId
}, dataList) {
	// The children takes precedence
	if (children) {
		return iterateChildren(children, dataList);
	}

	const template = getTemplate(templateId)||getTemplate(defaultTemplateId);

	return template && iterateChildren(template, dataList)||null;
}