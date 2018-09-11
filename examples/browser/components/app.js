// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';


const bakery = require('macaroon-bakery');
const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const monitor = require('../../../monitor');
const Dashboard = require('./dashboard');
const Header = require('./header');
const Login = require('./login');
const StatusBar = require('./statusbar');
const {Col, Row} = require('./widgets');


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {loginURL: '', notes: [], started: false};
  }

  async componentDidMount() {
    const props = this.props;
    const options = {
      debug: props.options.debug,
      facades: props.options.facades,
      bakery: new bakery.Bakery({
        visitPage: resp => this.setState({loginURL: resp.Info.VisitURL}),
        onSuccess: () => this.setState({loginURL: '', started: true})
      })
    };
    const ui = new UI(notes => this.setState({notes: notes}));
    try {
      await monitor(props.url, options, props.checkers, ui);
    } catch (err) {
      ui.error(err);
    }
  }

  render() {
    const state = this.state;
    const logs = state.notes.reduce((prev, cur) => prev.concat(cur.logs), []);
    return (
      <div>
        <Row><Col><h1>JAAS Monitor</h1></Col></Row>
        <Header started={state.started}></Header>
        <Login url={state.loginURL}></Login>
        <Dashboard notes={state.notes}></Dashboard>
        <StatusBar logs={logs}></StatusBar>
      </div>
    );
  }
}

App.propTypes = {
  checkers: PropTypes.array.isRequired,
  options: shapeup.shape({
    debug: PropTypes.bool,
    facades: PropTypes.array
  }).isRequired,
  url: PropTypes.string.isRequired
};


class UI {
  constructor(setNotes, key='root') {
    this.setNotes = setNotes;
    this.key = key;
  }

  withContext(ctx) {
    const parts = [];
    if (ctx.model) {
      parts.push(ctx.model);
    }
    if (ctx.checker) {
      parts.push(ctx.checker);
    }
    return new UI(this.setNotes, parts.join('-'));
  }

  _last() {
    return this.notes[this.notes.length - 1];
  }

  log(msg) {
    console.log('######################## log', msg);
    this._last().logs.push(msg);
  }

  info(msg) {
    console.log('######################## info', msg);
    this._last().infos.push(msg);
  }

  error(msg) {
    console.log('######################## error', msg);
    this._last().errors.push(msg);
  }

  addAction(text, callback) {
    this._last().actions.push({text, callback});
  }

  addLink(text, href) {
    this._last().links.push({text, href});
  }

  refresh() {
    console.log('refresh not implemented');
  }
}


module.exports = App;
