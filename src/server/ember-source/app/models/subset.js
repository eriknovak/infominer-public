import DS from 'ember-data';

export default DS.Model.extend({
    label: DS.attr('string'),
    description: DS.attr('string'),
    inDataset: DS.belongsTo('dataset'),
    usedBy: DS.hasMany('method', { inverse: 'appliedOn' }),
    resultedIn: DS.belongsTo('method', { inverse: 'produced' })
});
