// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

function Row(props) {
  return <div className="row">{props.children}</div>;
}
Row.propTypes = {
  children: PropTypes.node
};

function Col(props) {
  return <div className={'col-' + props.size}>{props.children}</div>;
}
Col.propTypes = {
  children: PropTypes.node,
  size: PropTypes.number
};
Col.defaultProps = {
  size: 12
};

function Icon(props) {
  return <i className={'p-icon--' + props.name} />;
}
Icon.propTypes = {
  name: PropTypes.string.isRequired
};

function Link(props) {
  return (
    <a className="p-button--neutral" href={props.href} target="_blank">
      {props.children}
    </a>
  );
}
Link.propTypes = {
  children: PropTypes.node,
  href: PropTypes.string.isRequired
};

class Button extends React.Component {
  render() {
    const props = this.props;
    const buttonTypeClasses = `p-button--${props.type} u-no-margin--bottom`;
    return (
      <button
        className={buttonTypeClasses}
        disabled={!!props.disabled}
        onClick={props.callback}>
        {props.children}
      </button>
    );
  }
}

Button.propTypes = {
  callback: PropTypes.func.isRequired,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  type: PropTypes.string.isRequired
};

module.exports = {Button, Col, Icon, Link, Row};
