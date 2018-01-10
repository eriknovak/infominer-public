import DS from 'ember-data';

export default DS.Model.extend({
    values: DS.attr('object'),
    subsets: DS.hasMany('subset'),
    selected: DS.attr('boolean', { defaultValue: false })
});
