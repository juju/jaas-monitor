// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const {Button, Icon} = require('./widgets');

function Notification(props) {
  const notificationTypeClasses = `p-notification--${props.type}`;
  let closeButton = null;
  if (props.onClose) {
    closeButton = (
      <Button type="neutral" callback={props.onClose}>
        <Icon name="close" />
      </Button>
    );
  }
  return (
    <div className={notificationTypeClasses}>
      <div className="p-notification__response">{props.children}</div>
      {closeButton}
    </div>
  );
}

Notification.propTypes = {
  onClose: PropTypes.func,
  type: PropTypes.string.isRequired
};

module.exports = Notification;
