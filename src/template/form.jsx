import React, {useState, useMemo} from "react";
import {Field, Formik, useFormik} from "formik";
import i18n from "../lang";
import {uniqId} from "./";
import renderElement from "./render";
import Input from "./input";

export function InputField({
	children,
	templateId,
	type,
	label,
	pre,
	sub,
	...props
}) {
	return (
		<Field {...props}>
			{({field, form, meta}) => (
				<Input
					type = {type}
					label = {label}
					pre = {pre}
					sub = {sub}
					form = {form}
					error = {meta && meta.error}
					children = {children}
					templateId = {templateId}
					{...props}
					{...field}
				/>
			)}
		</Field>
	)
}

export default function Form({
	title,
	description,
	className,
	children,
	templateId,
	fields,
	submitLabel = i18n('Submit'),
	init = true,
	onSubmit,
	...props
}) {
	const [notice, setNotice] = useState(null);

	// Generate field keys once
	const _fields = useMemo(
		() => {
			return fields && fields.map(
				f => {
					f.key = f.key||uniqId();

					return f;
				})
		},
		[init]
	);

	const inputField = (child) => {
		if (!_fields || !_fields.length) {
			return child;
		}

		return _fields.map(
			field => (
				<InputField
					{...child.props}
					{...field}
				/>
			))
	};

	const setAlert = child => {
		if (!notice || !notice.type) {
			return null;
		}

		return renderElement(
			{
				children: child.props.children,
				templateId: child.props.templateId,
				defaultTemplateId: '/template/form/alert'
			},
			notice
		)
	};

	const handleSubmit = (values, action) => {
		// Add notifier to the action object
		action.setAlert = alert => setNotice(alert);

		return onSubmit && onSubmit.call(null, values, action);
	}

	return (
		<Formik 
			onSubmit = {handleSubmit}
			{...props}
		>
			{(fProps) => renderElement(
				{
					children,
					templateId,
					defaultTemplateId: '/template/form'
				},
				{
					title,
					description,
					submitLabel,
					attr: {
						className,
						onSubmit: fProps.handleSubmit
					},
					error: fProps.errors.form,
					InputField: child => inputField(child),
					Alert: child => setAlert(child)
				}
			)}
		</Formik>
	)
}