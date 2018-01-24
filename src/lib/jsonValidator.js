// external modules
const Validator = require('jsonschema').Validator;
// internal modules
// TODO: logger module

/**
 * The JSON validator class.
 */
class JsonValidator {

    /**
     * Initializes the JSON validator.
     * @param {Object} params - The constructor parameter.
     */
    constructor(params) {
        let self = this;
        // save the JSON validator
        self._validator = new Validator();
        // the json schemas used to validate
        self.schemas = params;

    }

    validate(object, schema) {
        let self = this;
        let validation = self._validator.validate(object, schema);
        if (validation.errors.length) {
            // TODO: validation found errors - log them
            console.log(object);
            console.log(validation.errors);
            return false;
        } else {
            // validation found no errors -
            // object seems to follow the schema
            return true;
        }
    }
}

module.exports = function (params) {
    return new JsonValidator(params);
};

