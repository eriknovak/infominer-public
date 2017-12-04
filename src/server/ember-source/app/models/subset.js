import DS from 'ember-data';

export default DS.Model.extend({
    label: DS.attr('string'),
    description: DS.attr('string'),
    usedBy: DS.hasMany('method', { inverse: 'appliedOn' }),
    resultedIn: DS.belongsTo('method', { inverse: 'produced' }),
    documents: DS.hasMany('document'),
    documentCount: Ember.computed('documents.[]', function() {
        return this.hasMany('documents').ids().length;
    })
});
