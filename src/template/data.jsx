import _ from "underscore";
import {uniqId, iterateChildren} from "./";

export default function Data({
	children,
	value
}) {
	if (_.isArray(value)) {
		return children && value.map(
			v => iterateChildren(children, {value: v}));
	}

	if (_.isObject(value)) {
		return children && Object.entries(value)
			.map(([name, val]) => iterateChildren(children, {name, value: val}));
	}

	return children && iterateChildren(children, {value}) || value;
}