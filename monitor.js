// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const jujulib = require('jujulib');
const Limiter = require('concurrency-limiter');

/**
  Run the monitor, which in turns run all the checkers against all the models
  the user owns in the provided controller.

  @param {String} controllerURL The URL of the controller where to connect to.
  @param {Object} options Options for establishing the jujulib connection.
  @param {Array of functions} checkers A list of checker functions to run
    on every model in the controller. A checker is an asynchronous function
    whose promise is resolved when the check has been performed. It takes the
    following arguments:
      - connect: a function returning a jujulib connection to the model and a
        logout function to disconnect from the model. It is checker's
        responsibility to close the connection when done;
      - status: a recent full status of the model;
      - ui: the ui provided to run (see below).
  @param {Object} ui An object that can be used to interact with the user, with
    the following methods:
      - withContext(ctx) -> new ui instance: create and return a new ui
        instance with that context added;
      - log(msg): write a log message;
      - info(msg): write an info message;
      - error(msg): notify an error exists in the model;
      - addAction(text, callback): provide an action with the given text, and
        an asynchronous callback to be executed;
      - addLink(text, href): provide a link as an option to the user;
      - refresh(): refresh the whole user interface.
        When the action is triggered, the given callback must be called.
  @returns {Promise} Resolved when all checks have been performed on all
    models.
*/
async function run(controllerURL, options, checkers, ui) {
  const limiter = new Limiter(20);
  const connector = new Connector(controllerURL, options, limiter);
  // Connect to the JAAS controller.
  const {conn, logout} = await connector.connect();
  const modelManager = conn.facades.modelManager;
  // List models.
  const result = await modelManager.listModels({tag: conn.info.user.identity});
  logout();
  // Retrieve the full status from every model.
  const promises = result.userModels.map(model => {
    const modelURL = controllerURL.replace(
      '/api',
      `/model/${model.model.uuid}/api`
    );
    return inspectModel(modelURL, options, limiter, checkers, ui);
  });
  await Promise.all(promises);
}

/**
  Manage connecting to Juju models and controllers, and reusing existing
  connections if they are still alive.

  @param {String} url The URL of the controller or model where to connect to.
  @param {Object} options Options for establishing the jujulib connection.
  @param {Object} limiter A Limiter instance, used for limiting concurrent
    connections.
*/
class Connector {
  constructor(url, options, limiter) {
    this.url = url;
    this._options = options;
    this._limiter = limiter;
    this._conn = null;
  }

  async connect() {
    if (this._conn) {
      return {conn: this._conn, logout: () => {}};
    }
    const limiter = this._limiter;
    await limiter.enter();
    const {conn, logout} = await jujulib.connectAndLogin(
      this.url,
      {},
      this._options
    );
    this._conn = conn;
    return {
      conn,
      logout: () => {
        this._conn = null;
        logout();
        limiter.exit();
      }
    };
  }
}

/**
  Run all provided checkers against the model at the provided URL.

  @param {String} modelURL The URL of the model where to connect to.
  @param {Object} options Options for establishing the jujulib connection.
  @param {Object} limiter A Limiter instance, used for limiting concurrent
    connections.
  @param {Array of functions} checkers A list of checker functions to run.
  @param {Object} ui An object that can be used to interact with the user.
  @returns {Promise} Resolved when all checks have been performed.
*/
async function inspectModel(modelURL, options, limiter, checkers, ui) {
  ui = ui.withContext({model: modelURL});
  const connector = new Connector(modelURL, options, limiter);
  try {
    const {conn, logout} = await connector.connect();
    ui.log(`inspecting model at ${modelURL}`);
    const client = conn.facades.client;
    const status = await client.fullStatus();
    const connect = connector.connect.bind(connector);
    const promises = checkers.map(checker => {
      return runChecker(checker, connect, status, ui);
    });
    await Promise.all(promises);
    logout();
  } catch (err) {
    ui.error(`cannot inspect model at ${modelURL}: ${err}`);
  }
}

async function runChecker(checker, connect, status, ui) {
  ui = ui.withContext({checker: checker.name});
  try {
    await checker(connect, status, ui);
  } catch (err) {
    ui.error(`cannot run checker ${checker.name}: ${err}`);
  }
}

module.exports = run;
