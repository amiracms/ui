import React from "react";
import _ from "underscore";
import {uniqId} from "./";
import renderElement from "./render";

export function Text({
	type = "text",
	children,
	templateId,
	...props
}) {

	return renderElement(
		{
			children,
			templateId,
			defaultTemplateId: '/template/input/text'
		},
		{
			attr: {type, ...props}
		}
	)
}

export function TextArea({
	type,
	children,
	templateId,
	...props
}) {
	return renderElement(
		{
			children,
			templateId,
			defaultTemplateId: '/template/input/textarea'
		}, 
		{attr: props}
	)
}

export function Option({
	options = [],
	children,
	templateId
}) {
	if (!_.isArray(options) && _.isObject(options)) {
		options = Object.entries(options)
			.map(([name, label]) => ({value: name, label}));
	}

	return options.map(
		o => renderElement(
			{
				children,
				templateId,
				defaultTemplateId: '/template/input/option'
			},
			_.isObject(o) ? o : {value: o}
		));
}

export function CheckBox({
	name,
	value = true,
	label,
	children,
	templateId,
	...props
}) {
	return renderElement(
		{
			children,
			templateId,
			defaultTemplateId: '/template/input/checkbox'
		},
		{attr: {value, name, ...props}}
	)
}

export function Select({
	options,
	children,
	templateId,
	allowEmpty,
	emptyLabel = '',
	...props
}) {
	options = [...options];

	if (allowEmpty) {
		options.unshift({value: '', label: emptyLabel});
	}

	return renderElement(
		{
			children,
			templateId,
			defaultTemplateId: '/template/input/select'
		},
		{
			attr: props,
			options
		}
	)
}

export function CheckList({
	type = "checkbox",
	name,
	options = [],
	multiple,
	children,
	templateId,
	...props
}) {
	return renderElement(
		{
			children,
			templateId,
			defaultTemplateId: '/template/input/checklist'
		},
		{
			attr: {name, multiple, ...props},
			options
		}
	)
}

export function Search({
	value,
	placeholder = i18n('Search...'),
	searchOnChange = true,
	onSearch,
	children,
	templateId
}) {
	const [term, setTerm] = useState(value);

	const clear = () => {
		setTerm('');

		onSearch && onSearch.call(null);
	}

	const onBlur = () => {
		if (!searchOnChange) {
			return;
		}

		onSearch && onSearch.call(null, term);
	}

	const hasTerm = term ? ' has-term' : '';

	const maybeSearch = ev => {
		if ('Enter' !== ev.key || !ev.target.value) {
			return;
		}

		setTerm(ev.target.value);

		onSearch && onSearch.call(null, ev.target.value);
	}

	return renderElement(
		{
			children,
			templateId,
			defaultTemplateId: '/template/input/search'
		},
		{
			clear,
			search: () => onSearch && onSearch.call(null, term),
			attr: {
				onBlur,
				placeholder,
				onChange: ev => setTerm(ev.target.value),
				onKeyPress: maybeSearch,
				defaultValue: term,
				type: 'search'
			}
		}
	)
}

export function Input({
	type,
	...props
}) {
	switch(type) {
		default :
			return (
				<Text
					type = {type}
					{...props}
				/>
			);

		case 'textarea' :
			return (<TextArea {...props}/>);

		case 'select' :
			return (<Select {...props}/>);

		case 'checkbox' :
			return (<Checkbox {...props}/>);

		case 'checklist' :
			return (<CheckList {...props}/>);

		case 'image' :
		case 'video' :
		case 'audio' :
		case 'file' :
			//return (<InputUpload type={type} {...props}/>);
	}
}

export default function Field({
	type = "text",
	label,
	sub,
	pre,
	children,
	templateId,
	className = "input-field",
	error,
	render,
	form,
	...props
}) {
	const input = () => {
		switch(type) {
			default :
				return (
					<Text
						type = {type}
						{...props}
					/>
				);

			case 'textarea' :
				return (<TextArea {...props}/>);

			case 'select' :
				return (<Select {...props}/>);

			case 'checkbox' :
				return (<Checkbox {...props}/>);

			case 'checklist' :
				return (<CheckList {...props}/>);
		}
	}

	return renderElement(
		{
			children,
			templateId,
			defaultTemplateId: '/template/input/field'
		},
		{
			className,
			label,
			pre,
			sub,
			error,
			Input: input
		}
	)
}