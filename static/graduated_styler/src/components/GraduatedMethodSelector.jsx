import { ListGroup, ListGroupItem } from 'reactstrap'
import { NextButton, PreviousButton } from './CommonComponents'
import React, { Component } from 'react'

import classNames from 'classnames'

class GraduatedMethodSelector extends Component {
    state = {
        attrs: [],
        method: this.props.method || '',
        index: this.props.index || -1
    }
    renderHeader() {
        return (
            <div className="row">
        <div className="col-xs-5 col-md-4">
          <h4>{'Generate Thematic Styler'}</h4>
        </div>
        <div className="col-xs-7 col-md-8">
          <NextButton message="Next" clickAction={() => this.props.onComplete(this.state.method, this.state.index)} />
          <PreviousButton clickAction={() => this.props.onPrevious()} />
        </div>
      </div>
        )
    }
    render() {
        const { onComplete } = this.props;
        const methods = [
            {
                label: 'Equal Interval',
                value: 'EQUAL_INTERVAL'
      }, {
                label: 'Quantile',
                value: 'QUANTILE'
      }, {
                label: 'Natural Breaks (Jenks)',
                value: 'NATURAL_BREAKS'
      }
    ];
        return <div>
      {this.renderHeader()}
      <ListGroup>
        {methods.map((m, i) => <ListGroupItem className={classNames("list-group-item li-attribute", { "li-attribute-selected": this.state.index == i })} tag="a" href="#" onClick={() => this.setState({method: m.value, index: i})}>
          {m.label}
        </ListGroupItem>)}
      </ListGroup>
    </div>;
    }
}
export default GraduatedMethodSelector;
