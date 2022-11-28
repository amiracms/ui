import _ from "underscore"; 
import {iterateChildren} from "./render";

export default function If({
	children,
	state,
	context,
	is,
	isNot,
	$lt,
	$lte,
	$gt,
	$gte,
	$in,
	$notIn
}) {
	const literal = {undefined: true, null: true};
	
	if (literal[context]) {
		return null;
	}

	const render = () => iterateChildren(children, state);

	if (!_.isUndefined(is)) {
		return _.isEqual(is, context) && render();
	}

	if (!_.isUndefined(isNot)) {
		return !_.isEqual(isNot, context) && render();
	}

	if (!_.isUndefined($lt)) {
		return parseInt(context) < parseInt($lt) && render();
	}

	if (!_.isUndefined($lte)) {
		return parseInt(context) <= parseInt($lte) && render();
	}

	if (!_.isUndefined($gt)) {
        return parseInt(context) > parseInt($gt) && render();
    }

    if (!_.isUndefined($gte)) {
        return parseInt(context) >= parseInt($gte) && render();
    }

    if (!_.isUndefined($in)) {
        const _in = _.isArray($in) ? $in : $in.split(",").map(e => e.trim());

        return _.contains(_in, context) && render();
    }

    if (!_.isUndefined($notIn)) {
        const notIn = _.isArray($notIn) ? $notIn : $notIn.split(",").map(e => e.trim());

        return !_.contains(notIn, context) && render();
    }

	return context && render();
}