// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const React = require('react');


/**
  Check that the model agent is up and running.
*/
async function checkModel(connect, status, ui) {
  const model = status.model;
  const modelStatus = model.modelStatus.status;
  if (modelStatus !== 'available') {
    ui.error(`model ${model.name} - status is ${modelStatus}`);
  }
}

/**
  Check that there are no units in error.
  Provide the ability to retry units in error state.
*/
async function checkUnits(connect, status, ui) {
  for (let app in status.applications) {
    const units = status.applications[app].units;
    for (let unit in units) {
      const workloadStatus = units[unit].workloadStatus;
      if (workloadStatus.status === 'error') {

        ui.error(
          `model ${status.model.name} - unit ${unit} is in ${
            workloadStatus.status
          } state: ${workloadStatus.info}`
        );

        ui.addAction('Retry', async _ => {
          const {conn, logout} = await connect();
          try {
            ui.log(`retrying unit ${unit}`);
            await conn.facades.client.resolved({unitName: unit});
          } finally {
            logout();
          }
          setTimeout(async () => {
            const {conn, logout} = await connect();
            try {
              status = await conn.facades.client.fullStatus();
            } finally {
              logout();
            }
            ui.refresh();
            checkUnits(connect, status, ui);
          }, 3000);
        });

        ui.addAction('Show Status', async write => {
          const {conn, logout} = await connect();
          let handle;
          handle = conn.facades.client.watch((err, delta) => {
            if (err) {
              ui.error(err);
              return;
            }
            handle.stop();
            logout();
            // write(<Status data={fromWatcher(delta).changed} />);
            write(<span>Hello I am status</span>);
          });

        });

        const {conn, logout} = await connect();
        try {
          const info = await conn.facades.client.modelInfo();
          const user = info.ownerTag.split('@')[0].slice(5);
          ui.addLink(
            'Open GUI',
            `https://jujucharms.com/u/${user}/${status.model.name}`
          );
        } finally {
          logout();
        }
      }
    }
  }
}

/**
  Check jujushell errors.
*/
async function checkJujushell(connect, status, ui) {
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
        ui.error(
          `model ${
            status.model.name
          } - app ${app} exposed at ${dnsName} has ${numErrors} errors`
        );
      }
    }
  } finally {
    logout();
  }
}

/**
  Send a XHR request using promises.

  @param {String} method The HTTP method.
  @param {String} url The URL to use for the request.
  @returns {Promise} Resolved when a good response is returned, rejected when
    a bad response (>300) is returned.
*/
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

module.exports = {
  checkModel,
  checkUnits,
  checkJujushell
};
