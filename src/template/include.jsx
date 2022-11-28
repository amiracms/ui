import React from "react";
import {renderElement} from "./render";

export default function Include({
	templateId,
	state
}) {
	return renderElement({templateId}, state);
}