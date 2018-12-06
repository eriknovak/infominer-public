import DS from 'ember-data';

export default DS.Model.extend({
    methodType: DS.attr('string'),
    parameters: DS.attr('object', { defaultValue: null }),
    statistics: DS.attr('object', { defaultValue: null }),
    currentDoc: DS.attr('object', { defaultValue: null }),
    appliedOn: DS.belongsTo('subset', { inverse: null })
});
