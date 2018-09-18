// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

function Notification(props) {
  const notificationTypeClasses = `p-notification--${props.type}`;
  return (
    <div className={notificationTypeClasses}>
      <p className="p-notification__response">{props.children}</p>
    </div>
  );
}

module.exports = Notification;
