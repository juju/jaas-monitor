// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const {Col, Row} = require('./widgets');

function StatusBar(props) {
  const text = props.logs
    .slice()
    .reverse()
    .join('\n');
  return (
    <Row>
      <Col size={12}>
        <textarea
          rows="7"
          readOnly={true}
          value={text}
          placeholder="Awaiting logs..."
        />
      </Col>
    </Row>
  );
}
StatusBar.propTypes = {
  logs: PropTypes.array.isRequired
};

module.exports = StatusBar;
