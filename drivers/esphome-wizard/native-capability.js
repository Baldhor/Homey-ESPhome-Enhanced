'use strict';

/**
 * Helper class to handle Native Capability
 * 
 * A native capability is a capability of an ESPhome device's entity
 */

const NATIVE_CAPABILITY_TYPE = Object.freeze([
    'sensor',
    'switch',
    'button',
    'cover'
]);

class NativeCapability {
    entityId = null;
    entityName = null;
    type = null;
    attribut = null;

    /**
     * List of configuration
     * 
     * Format:
     * {
     *  key : value
     * }
     * 
     * Know keys:
     * - showUI : false (boolean)
     * - deviceClass : string not empty (optionnal)
     * - readOnly : true (boolean), exclusive with writeOnly
     * - writeOnly : true (boolean), exclusive with readOnly
     * - usage: setting, diagnostic (optionnal)
     * - precision : integer (positive)
     * - unit : string not empty, no control on the format
     */
    configs = null;

    /**
     * List of constraints
     * => Must be considered in the UI!
     * 
     * Constraints rarely goes alone!
     * 
     * Format:
     * {
     *  key : value
     * }
     * 
     * Know keys combination:
     * - min + max + step + mode
     * 
     * Know keys:
     * - min : float
     * - max : float
     * - step : float
     * - mode: box or slidder (box by default)
     */
    constraints = null;

    /**
     * Special case:
     * - 'templateCover': It use position to communicate (number with values 0 for closed and 1 for open), but Homey expect a boolean
     */
    specialCase = null;

    /**
     * Last know value in ESPhome format!
     */
    value = null;

    constructor(entityId, entityName, type, attribut, configs, constraints, specialCase) {
        this.entityId = entityId;
        this.entityName = entityName;
        this.type = type;
        this.attribut = attribut;
        this.configs = configs;
        this.constraints = constraints;
        this.specialCase = specialCase;
    }

    static buildId(entityId, attribut) {
        return entityId + ":" + attribut;
    }

    getId() {
        return NativeCapability.buildId(this.entityId, this.attribut);
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
    }

    getConfig(key) {
        return this.configs[key];
    }

    getConstraint(key) {
        return this.constraints[key];
    }

    getSpecialCase() {
        return this.specialCase;
    }
}

module.exports = NativeCapability;
