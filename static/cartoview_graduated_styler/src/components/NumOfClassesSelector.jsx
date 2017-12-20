import { NextButton, PreviousButton } from './CommonComponents'
import React, { Component } from 'react'

import classNames from 'classnames'

class NumOfClassesSelector extends Component {
  state = {
    attrs: [],
    numOfClasses: this.props.numOfClasses || undefined,
    index: this.props.index || -1
  }
  renderHeader() {
    return (
      <div className="row">
        <div className="col-xs-5 col-md-4">
          <h4>{'Generate Thematic Styler'}</h4>
        </div>
        <div className="col-xs-7 col-md-8">
          <NextButton message="Next" clickAction={() => this.props.onComplete(this.state.numOfClasses, this.state.index)} />
          <PreviousButton clickAction={() => this.props.onPrevious()} />
        </div>
      </div>
    )
  }
  render() {
    const { onComplete } = this.props
    const classes = [2, 3, 4, 5, 6, 7]
    return <div>
      {this.renderHeader()}
      <ul className={'list-group'}>
        {classes.map((c, i) => <li className={classNames("list-group-item li-attribute", { "li-attribute-selected": this.state.index == c })} onClick={() => this.setState({ numOfClasses: c, index: c })}>
          {c}
        </li>)
        }
      </ul>
    </div>
  }
}
export default NumOfClassesSelector;
