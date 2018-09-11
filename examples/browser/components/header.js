// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';


const PropTypes = require('prop-types');
const React = require('react');

const {Col, Icon, Row} = require('./widgets');


function Header(props) {
  if (props.started) {
    return (
      <Row>
        <Col size={1}><Icon name="information"></Icon></Col>
        <Col size={11}>Check started</Col>
      </Row>
    );
  }
  return <Row><Col>Check the status of your JAAS models</Col></Row>;
}
Header.propTypes = {
  started: PropTypes.bool.isRequired
};


module.exports = Header;
