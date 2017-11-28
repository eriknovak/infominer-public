import DS from 'ember-data';

export default DS.Model.extend({
    fields: DS.attr(),
    values: DS.attr('parameters'),
    inSubsets: DS.hasMany('subset')
});
