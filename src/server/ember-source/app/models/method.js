import DS from 'ember-data';

export default DS.Model.extend({
    type: DS.attr('string'),
    parameters: DS.attr('parameters'),
    produced: DS.hasMany('subset', { inverse: 'resultedIn' }),
    appliedOn: DS.belongsTo('subset', { inverse: 'usedBy' })
});
