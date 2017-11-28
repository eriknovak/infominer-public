import DS from 'ember-data';

export default DS.Model.extend({
    label: DS.attr('string'),
    description: DS.attr('string'),
    created: DS.attr('date'),
    numberOfDocuments: DS.attr('number'),
    hasSubsets: DS.hasMany('subset', { inverse: null })
});
