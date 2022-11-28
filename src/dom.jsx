import _ from "underscore";
import {devAssert} from "./utils";

export default function $dom(selector) {
	return new Dom(selector);
}

function Dom(selector) {
	devAssert(window && !!window.document, 'Invalid browser!');

	this.selector = _.isObject(selector) 
		? [selector]
		: Array.from(document.querySelectorAll(selector));

	return this;
}

Dom.prototype.attr = function(name, value) {
	if (!value) {
		// Get the attribute name of the first selector
		const sel = _.first(this.selector);

		return sel.getAttribute(name);
	}

	this.selector
		.reduce(
			(p, el) => el.setAttribute(name, value),
			null
		);

	return this;
}

Dom.prototype.on = function(name, callback) {
	this.selector
		.reduce(
			(p, el) => {
				if (el.addEventListener) {
					el.addEventListener(name, callback);

					return;
				}

				if (el.attachEvent) {
					el.attachEvent(`on${name}`, callback);

					return;
				}

				el[`on${name}`] = callback;
			},
			null
		);

	return this;
}

Dom.prototype.off = function(name, callback) {
	this.selector
		.map(el => el.removeEventListener(name, callback, true));

	return this;
}

Dom.prototype.css = function(name, value) {
	if (_.isUndefined(value)) {
		// Get the style value on the first element
		const style = window.getComputedStyle(_.first(this.selector));

		return style.getPropertyValue(name);
	}

	this.selector
		.reduce(
			(p, el) => {
				el.style[name] = value;
			},
			null
		);

	return this;
}

Dom.prototype.children = function() {
	// Just get the children of the first element in the selector
	const first = _.first(this.selector);

	return Array.from(first.getElementsByTagName('*'));
}

Dom.prototype.hasAnimation = function() {
	return findStyle(_.first(this.selector), 'animation-duration');
}

Dom.prototype.hasTransition = function() {
	return findStyle(_.first(this.selector), 'transition-duration');
}

function findStyle(el, name) {
	// Check the element first
	const style = window.getComputedStyle(el);
	const value = parseFloat(style.getPropertyValue(name));

	if (value && value > 0) {
		return true;
	}

	// Check children
	const children = Array.from(el.getElementsByTagName('*'));

	if (!children || !children.length) {
		return false;
	}

	for(const child of children) {
		const has = findStyle(child, name);

		if (has) {
			return true;
		}
	}

	return false;
}

Dom.prototype.onTransitionStart = function(callback) {
	const onStart = getStyleName({
		"transition"      : "transitionstart",
      	"OTransition"     : "oTransitionStart",
      	"MozTransition"   : "transitionstart",
      	"WebkitTransition": "webkitTransitionStart"
	});

	return this.on(onStart, callback);
};

Dom.prototype.onTransitionEnd = function(callback) {
	const onEnd = getStyleName({
		"transition"      : "transitionend",
      	"OTransition"     : "oTransitionEnd",
      	"MozTransition"   : "transitionend",
      	"WebkitTransition": "webkitTransitionEnd"
	});

	return this.on(onEnd, callback);
}

Dom.prototype.onAnimationStart = function(callback) {
	const startName = getStyleName({
		"animation"      : "animationstart",
      	"OAnimation"     : "oAnimationStart",
      	"MozAnimation"   : "animationstart",
      	"WebkitAnimation": "webkitAnimationStart"
	});

	return this.on(startName, callback);
}

Dom.prototype.onAnimationEnd = function(callback) {
	const endName = getStyleName({
		"animation"      : "animationend",
      	"OAnimation"     : "oAnimationEnd",
      	"MozAnimation"   : "animationend",
      	"WebkitAnimation": "webkitAnimationEnd"
	});

	return this.on(endName, callback);
}

function getStyleName(trans) {
	const style = document.body.style;

	for(let transition in trans) {
		if (style[transition] !== undefined) {
			return trans[transition];
		}
	}
}