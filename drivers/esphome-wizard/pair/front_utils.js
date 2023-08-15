/**
 * Hide a HTML element and all its sub element
 * FIXME: Should be reccursive?
 */
function hideAll(element) {
    element.hidden = true;
    Array.from(element.children).forEach(function (subElement) {
        subElement.hidden = true;
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

