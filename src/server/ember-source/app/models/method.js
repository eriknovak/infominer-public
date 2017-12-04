import DS from 'ember-data';

export default DS.Model.extend({
    methodType: DS.attr('string'),
    parameters: DS.attr('object'),
    result: DS.attr('object'),
    produced: DS.hasMany('subset', { inverse: 'resultedIn' }),
    appliedOn: DS.belongsTo('subset', { inverse: 'usedBy' })
});
