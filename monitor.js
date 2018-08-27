// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

const WebSocket = require('websocket').w3cwebsocket;
const bakery = require('macaroon-bakery');
// Bakery uses btoa and MLHttpRequest.
global.btoa = require('btoa');
global.XMLHttpRequest = require('xhr2');

const jujulib = require('jujulib');
const Limiter = require('concurrency-limiter');


async function run(controllerURL, options, checkers, writer) {
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
    const modelURL = controllerURL.replace('/api', `/model/${model.model.uuid}/api`);
    return inspectModel(modelURL, options, limiter, checkers, writer);
  });
  await Promise.all(promises);
  writer.log('done');
}


async function inspectModel(modelURL, options, limiter, checkers, writer) {
  writer.log(`inspecting model at ${modelURL}`);
  const connector = new Connector(modelURL, options, limiter);
  try {
    const {conn, logout} = await connector.connect();
    const client = conn.facades.client;
    const status = await client.fullStatus();
    const connect = connector.connect.bind(connector);
    const promises = checkers.map(checker => {
      return runChecker(checker, connect, status, writer);
    });
    await Promise.all(promises);
    logout();
  } catch (err) {
    writer.error(`cannot inspect model at ${modelURL}: ${err}`);
  }
}


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
    const {conn, logout} = await jujulib.connectAndLogin(this.url, {}, this._options);
    this._conn = conn;
    return {conn, logout: () => {
      this._conn = null;
      logout();
      limiter.exit();
    }};
  }
}


async function runChecker(checker, connect, status, writer) {
  try {
    await checker(connect, status, writer);
  } catch (err) {
    writer.error(`cannot run checker ${checker.name}: ${err}`);
  }
}


async function main() {
  const options = {
    debug: false,
    facades: [
      require('jujulib/api/facades/application-v5.js'),
      require('jujulib/api/facades/client-v1.js'),
      require('jujulib/api/facades/model-manager-v4.js')
    ],
    wsclass: WebSocket,
    bakery: new bakery.Bakery({
      visitPage: resp => console.log('visit this URL to login:', resp.Info.VisitURL)
    })
  };
  const checkers = [checkModel, checkUnits, checkJujushell];
  try {
    await run('wss://jimm.jujucharms.com:443/api', options, checkers, console);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
  process.exit(0);
}


main();


// Checkers.

async function checkModel(connect, status, writer) {
  const model = status.model;
  writer.log(`model ${model.name} - ${model.cloudTag.slice(6)} (${model.region})`);
  const modelStatus = model.modelStatus.status;
  if (modelStatus !== 'available') {
    writer.log(`model ${model.name} - status is ${modelStatus}`);
  }
}


async function checkUnits(connect, logout, status, writer) {
  for (let app in status.applications) {
    const units = status.applications[app].units;
    for (let unit in units) {
      const workloadStatus = units[unit].workloadStatus;
      if (workloadStatus.status === 'error') {
        writer.log(`model ${status.model.name} - unit ${unit} is in ${workloadStatus.status} state: ${workloadStatus.info}`);
      }
    }
  }
}


async function checkJujushell(connect, status, writer) {
  const {conn, logout} = await connect();
  const application = conn.facades.application;
  try {
    for (let app in status.applications) {
      const info = status.applications[app];
      if (!info.charm.startsWith('cs:~juju-gui/jujushell')) {
        continue;
      }
      const result = await application.get({application: app});
      const dnsName = result.config['dns-name'].value;
      const resp = await makeRequest('GET', `https://${dnsName}/metrics`);
      let numErrors = 0;
      resp.split('\n').forEach(line => {
        if (line.startsWith('jujushell_errors_count')) {
          numErrors += parseInt(line.split(' ').reverse()[0], 10);
        }
      });
      if (numErrors > 0) {
        writer.log(`model ${status.model.name} - app ${app} exposed at ${dnsName} has ${numErrors}`);
      }
    }
  } finally {
    logout();
  }
}


function makeRequest(method, url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
        return;
      }
      reject({status: this.status, statusText: xhr.statusText});
    };
    xhr.onerror = function() {
      reject({status: this.status, statusText: xhr.statusText});
    };
    xhr.send();
  });
}
