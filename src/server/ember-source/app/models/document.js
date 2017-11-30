import DS from 'ember-data';

export default DS.Model.extend({
    values: DS.attr('object'),
    selected: DS.attr('boolean', { defaultValue: false })
});
