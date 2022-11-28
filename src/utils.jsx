import _ from "underscore";

export function setError(error, code) {
    const message = _.isObject(error) ? error.message : error;
    const errorCode = _.isObject(error) ? error.code : code;

	const err = new Error(message);
	err.code = errorCode;

	return err;
}

/**
 * Assets the given condition and returns and error with custom message.
 **/
export function devAssert(condition, message) {
    if ((_.isBoolean(condition) && condition) || condition) {
        return;
    }

    throw new Error(message);
}