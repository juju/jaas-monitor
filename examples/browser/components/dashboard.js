// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const {Button, Col, Row} = require('./widgets');
const Notification = require('./notification');

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const notifications = this.props.notifications.map(notification => {
      const contents = [];

      notification.infos.forEach(info => {
        contents.push(
          <Row key={notification.key + '-infos'}>
            <Col size={12}>
              <Notification type="information">{info}</Notification>
            </Col>
          </Row>
        );
      });

      notification.errors.forEach(err => {
        contents.push(
          <Row key={notification.key + '-errors'}>
            <Col size={12}>
              <Notification type="negative">{err}</Notification>
            </Col>
          </Row>
        );
      });

      if (notification.actions.length || notification.links.length) {
        const cols = [];
        notification.links.forEach(({text, href}) => {
          cols.push(
            <Button type="neutral" href={href}>
              {text}
            </Button>
          );
        });
        notification.actions.forEach(({text, callback}) => {
          cols.push(
            <Button type="positive" callback={callback}>
              {text}
            </Button>
          );
        });
        contents.push(
          <Row key={notification.key + '-actions-and-links'}>{cols}</Row>
        );
      }
      return contents;
    });
    if (notifications.length > 0) {
      return (
        <div className="p-strip--light">
          <Row>
            <div className="p-card--highlighted">{notifications}</div>
          </Row>
        </div>
      );
    } else {
      return null;
    }
  }
}

Dashboard.propTypes = {
  notifications: PropTypes.array.isRequired
};

module.exports = Dashboard;
