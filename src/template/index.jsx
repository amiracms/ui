import React from "react";
import _ from "underscore";
import renderElement from "./render";

export const uniqId = () => _.uniqueId('tpl_');

export default class Template extends React.Component {
    /**
     * Constructor
     * 
     * @property {string} defaultTemplateId
     *      The location of the default template id to use when there's no template id set.
     * @property {string} templateId
     *      The templater's location.
     **/
    constructor(props) {
        super(props);

        this.mounted = false;
        this.state = this.props.defaultState||{};
    }

    uniqId() {
        return _.uniqueId('tpl');
    }

    /** Must be overriden in a sub-class **/
    onLoad() {}

    /** Must be overriden in a sub-class **/
    onUnload() {}

    componentDidCatch(error, errorInfo) {
        if (!error) {
            return;
        }

        this.setState({hasError: true});
    }

    componentDidMount() {
        this.mounted = true;

        if (this.state.hasError) {
            return;
        }

        this.onLoad();
    }

    componentDidUpdate() {
        this.mounted = true;

        if (this.state.hasError) {
            return;
        }

        this.onLoad();
    }

    componentWillUnmount() {
        this.mounted = false;
        this.onUnload();
    }

    hasError() {
        return this.state.hasError;
    }

    getDataList() {
        return {...this.state};
    }

    render() {
        if (this.hasError()) {
            return null;
        }

        return renderElement(
        	{
        		children: this.props.children,
        		templateId: this.props.templateId,
        		defaultTemplateId: this.props.defaultTemplateId
        	},
        	this.getDataList()
        )
    }
}