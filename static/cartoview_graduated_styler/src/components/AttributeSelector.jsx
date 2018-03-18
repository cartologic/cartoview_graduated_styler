import { Loader, NextButton, PreviousButton, Tip } from './CommonComponents'
import React, { Component } from 'react'

import WMSClient from "../gs-client/WMSClient.jsx"
import classNames from 'classnames'
export default class AttributeSelector extends Component {
    state = {
        attrs: [],
        selectedIndex: this.props.index ? this.props.index : -1,
        selectedAttribute: this.props.attribute ? this.props.attribute : ''
    }
    componentDidMount() {
        const { layerName } = this.props.config;
        WMSClient.getLayerAttributes( layerName ).then( ( attrs ) => {
            if(attrs && attrs.length > 0){
                this.setState( { attrs } );
            }
            else{
                this.setState({noAttributes: true, loading: false})
            }
        } );
    }
    onComplete() {
        this.props.onComplete( this.state.selectedAttribute, this.state.selectedIndex )
    }
    renderNoAttributesErrorMessage(){
        return(
            <div className="panel panel-danger">
                <div className="panel-heading">Error:</div>
                <div className="panel-body">
                    The layer has no attributes !
                </div>
            </div>
        )
    }
    renderTip(){
        return (
            <div className="row">
                <div className="col-md-12">
                    <Tip text={this.props.tip} />
                </div>
            </div>
        )
    }
    renderLayerAttributes(attrs, isGeom, filter){
        return (
            <ul className="list-group">
                {attrs.map((a, i) => isGeom(a) || !filter(a)
                    ? null
                    : <li className={classNames("list-group-item li-attribute", { "li-attribute-selected": this.state.selectedIndex == i })} onClick={() => {
                        this.setState({ selectedAttribute: a.attribute, selectedIndex: i })
                    }}>
                        {a.attribute_label || a.attribute}
                        ({a.attribute_type})
                </li>)}
            </ul>
        )
    }
    render() {
        const { attrs } = this.state;
        const { onComplete, filter } = this.props;
        const isGeom = ( a ) => {
            return a.attribute_type.toLowerCase().indexOf( "gml:" ) ==
                0;
        }

        if (this.state.noAttributes) 
            return (
                <div>
                    {/* {this.renderNoAttributesErrorMessage()} */}
                    {this.renderTip()}
                </div>
            )

        return (
            <div>
                <div className="row">
                    <div className="col-xs-5 col-md-4">
                        <h4>{'Select Attribute'}</h4>
                    </div>
                    <div className="col-xs-7 col-md-8">
                        <NextButton disabled={this.state.selectedAttribute ? false : true} clickAction={() => this.onComplete()} />
                        <PreviousButton clickAction={() => this.props.onPrevious()} />
                    </div>
                </div>
                {this.renderLayerAttributes(attrs, isGeom, filter)}

                {this.renderTip()}
            </div>
        )
    }
}
