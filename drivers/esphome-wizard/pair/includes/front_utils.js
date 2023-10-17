function compareZoneId(a, b) {
  wizardlog('compareZoneId:', a, b);

  return configuration.zones.find(zone => zone.zoneId === a).zoneOrder - configuration.zones.find(zone => zone.zoneId === b).zoneOrder;
}

function extractKeys(object) {
  wizardlog('extractKeys:', object);
  return Object.keys(object);
}

function alert(msg, icon = null) {
  return new Promise(resolve => {
    Homey.alert(msg, icon, resolve);
  });
}

function confirm(msg, icon = null) {
  return new Promise(resolve => {
    Homey.confirm(msg, icon, (_, response) => resolve(response));
  });
}

/**
 * Hide a HTML element and all its sub element
 * FIXME: Should be reccursive?
 */
function hideAll(element) {
  element.hidden = true;
  Array.from(element.children).forEach(child => {
    hideAll(child);
  });
}

/**
 * Enable a button
 */
function enableButton(button) {
  if (button.classList.contains("is-disabled"))
    button.classList.remove("is-disabled");
  button.disabled = false;
}

/**
 * Disable a button
 */
function disableButton(button) {
  if (!button.classList.contains("is-disabled"))
    button.classList.add("is-disabled");
  button.disabled = true;
}

function checkIfValidIpAddress(input) {
  // Regular expression to check if input is a valide ip address
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input);
}

function checkIfValidPort(input) {
  // Regular expression to check if input is a valid port number
  return /^((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4}))$/.test(input);
}

function getPortOrDefault(input) {
  let port = '6053';
  try {
    tmpPort = parseInt(input, 10);
    if (!isNaN(tmpPort))
      port = String(tmpPort);
  } catch (error) {
    // Well that didn't work, let assume standard port
  }

  return port;
}
