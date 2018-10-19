// Copyright 2018 Canonical Ltd.
// Licensed under the LGPLv3, see LICENCE.txt file for details.

'use strict';

const {processDeltas} = require('@canonical/maraca/lib/delta-handlers');
const {Status, Terminal} = require('@canonical/juju-react-components');
const React = require('react');

/**
  Check that the model agent is up and running.
*/
async function checkModel(connect, status, ui) {
  const model = status.model;
  const modelStatus = model.modelStatus.status;
  if (modelStatus !== 'available') {
    ui.error(`model ${model.name} - status is ${modelStatus}`);
    ui.addLink('File RT', `http://rt.admin.canonical.com/`);
  }
}

/**
  Check that there are no units in error.
  Provide the ability to retry units in error state.
*/
async function checkUnits(connect, status, ui) {
  const refresh = () => {
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
  };

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

        ui.addAction('Retry', async write => {
          const {conn, logout} = await connect();
          try {
            write(`retrying unit ${unit}`, {autoclose: true});
            await conn.facades.client.resolved({unitName: unit});
          } finally {
            logout();
          }
          refresh();
        });

        const machine = units[unit].machine;
        if (unitsInMachine(status, machine).length <= 1) {
          ui.addAction('Replace', async write => {
            const {conn, logout} = await connect();
            try {
              write(`replacing unit ${unit}`, {autoclose: true});
              ui.log(`destroying machine ${machine}`);
              await conn.facades.client.destroyMachines({
                machineNames: machine,
                force: true
              });
              ui.log(`adding another unit to ${app}`);
              await conn.facades.application.addUnits({
                application: app,
                numUnits: 1
              });
            } finally {
              logout();
            }
            refresh();
          });
        }

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
            const data = processDeltas(delta.deltas).changed;
            const model = status.model;
            const modelTag = conn.info.modelTag.split('-');
            modelTag.shift();
            write(
              <Status
                generateApplicationOnClick={() => {}}
                generateApplicationURL={() => {}}
                generateCharmURL={() => {}}
                generateMachineOnClick={() => {}}
                generateMachineURL={() => {}}
                generateUnitOnClick={() => {}}
                generateUnitURL={() => {}}
                getIconPath={() => {}}
                model={{
                  cloud: model.cloudTag.split('-')[1],
                  environmentName: model.name,
                  modelUUID: modelTag.join('-'),
                  region: model.region,
                  sla: model.sla,
                  version: model.version
                }}
                navigateToApplication={() => {}}
                navigateToCharm={() => {}}
                navigateToMachine={() => {}}
                valueStore={{
                  applications: data.applications || {},
                  machines: data.machines || {},
                  relations: data.relations || {},
                  remoteApplications: data.remoteApplications || {},
                  units: data.units || {}
                }}
              />
            );
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
  Return a list of units located in the given machine.

  @param {Object} status The model status.
  @param {String} machine The machine id.
  @returns {Array} A list of names for units placed in the given machine.
*/
function unitsInMachine(status, machine) {
  const result = [];
  for (let app in status.applications) {
    const units = status.applications[app].units;
    for (let unit in units) {
      if (units[unit].machine === machine) {
        result.push(unit);
      }
    }
  }
  return result;
}

/**
  Check jujushell errors.
*/
async function checkJujushell(connect, status, ui) {
  const {conn, logout, options, url} = await connect();
  const application = conn.facades.application;
  try {
    for (let app in status.applications) {
      const info = status.applications[app];
      if (!info.charm.startsWith('cs:~juju-gui/jujushell')) {
        continue;
      }
      const result = await application.get({application: app});
      const dnsName = result.config['dns-name'].value;
      const target = `https://${dnsName}/metrics`;
      ui.log(`making a GET request to ${target}`);
      const resp = await makeRequest(
        'GET',
        `https://cors-anywhere.herokuapp.com/${target}`
      );
      let numErrors = 0;
      const errors = {};
      resp.split('\n').forEach(line => {
        if (line.startsWith('jujushell_errors_count')) {
          const message = line.slice(
            line.indexOf('"') + 1,
            line.lastIndexOf('"')
          );
          const num = parseInt(line.split(' ').reverse()[0], 10);
          numErrors += num;
          errors[message] = num;
        }
      });
      if (numErrors > 0) {
        ui.error(
          `model ${
            status.model.name
          } - app ${app} exposed at ${dnsName} has ${numErrors} errors`
        );

        ui.addAction('Show Errors', async write => {
          const rows = [];
          for (let message in errors) {
            rows.push(
              <tr key={message}>
                <td key="message">{message}</td>
                <td key="#">{errors[message]}</td>
              </tr>
            );
          }
          write(
            <table>
              <thead>
                <tr>
                  <th key="message">message</th>
                  <th key="#">#</th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          );
        });

        // If the terminal is connected to JAAS, and we are also connected to
        // JAAS, then we can also offer the ability to actually open the shell.
        const host = url.split('/')[2];
        if (result.config['juju-addrs'].value === host) {
          ui.addAction('Open Terminal', async write => {
            const storage = options.bakery.storage;
            const token = JSON.parse(atob(storage.get('identity')));
            const macaroons = {'https://api.jujucharms.com/identity': token};
            write(
              <Terminal
                WebSocket={WebSocket}
                addNotification={() => {}}
                address={`wss://${dnsName}/ws/`}
                changeState={() => {}}
                creds={{macaroons: macaroons}}
              />
            );
          });
        }
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
