import React from "react";
import {parseDOM} from "htmlparser2";
import _ from "underscore";
import {hasComponent, renderComponent} from "./component";

export default function parseHTML(html) {
	if (_.isObject(html) && React.isValidElement(html)) {
		return html;
	}
	
	const nodes = parseDOM(html, {
		lowerCaseTags: false,
		lowerCaseAttributeNames: false,
		recognizeSelfClosing: true,
		decodeEntities: true
	});

	return nodes.map(parseNode);
}

function parseAttr(attr, nodeName) {
	let keys = {
        class: 'className',
        colspan: 'colSpan',
        rowspan: 'rowSpan',
        autofocus: 'autoFocus',
        autoplay: 'autoPlay',
        crossorigin: 'crossOrigin',
        srcset: 'srcSet',
        tabindex: 'tabIndex',
        usemap: 'useMap',
        maxlength: 'maxLength',
        minlength: 'minLength',
        accesskey: 'accessKey',
        autocomplete: 'autoComplete',
        for: 'htmlFor',
        readonly: 'readOnly',
        cellpadding: 'cellPadding',
        cellspacing: 'cellSpacing',
        enctype: 'encType',
        inputmode: 'inputMode'
    };

    const isInput = _.contains(["input", "select", "textarea"], nodeName);
    for(const key of _.keys(attr)) {
        let value = attr[key];

        if ("style" === key) {
            value = parseStyle(value);
        }

        // Transform boolean into literal
        if (_.indexOf(["true", "false"], value) >= 0) {
            value = "true" === value;
        }

        // Maybe translate
        if (value && value.match && value.match(/@lang/)) {
            const lang = value.replace("@lang(", "").replace(")", "");
        
            value = __( lang, 'timeslot' );
        }

        attr[key] = value;

        // Transform only to default value for none <option>
        if ("value" === key && isInput) {
            attr.defaultValue = value;

            delete attr.value;
        }

        if (keys[key]) {
            attr[keys[key]] = value;
            delete attr[key];
        }
    }

    return attr;
}

function parseStyle(styleStr) {
    let str = styleStr.replace(/[{}]/g, ""),
        style = {};

    for(let key of str.split(",")) {
        key = key.split(":");

        style[key[0].trim()] = key[1].trim();
    }

    return style;
}

let pos = 0;

function parseNode(node) {
	pos++;

	const key = `n_${pos}`;

	switch(node.type) {
		case "comment" :
		case "script" :
		case "style" :
		case "link" :
			return null;
		case "text" :
			let text = node.data;

			if (!text) {
				return null;
			}

			if (node.parent && _.contains(["table", "tbody", "thead", "tfoot", "tr"], node.parent.name)) {
				return null;
			}

			//text = text.trim().replace(/ |\t/g, "");

			return node.data;

			//return <Text key={key} content={node.data}/>;

		case "tag" :
			let children = null;

			if (!_.isEmpty(node.children)) {
				children = node.children.map(parseNode);
			}

			const attr = parseAttr(node.attribs, node.name);
			attr.key = key;

			if (hasComponent(node.name)) {
				return renderComponent(node.name, attr, children);
			}

			return React.createElement(node.name, attr, children);
	}

	return null;
}

function Text({content}) {
	return content;
}