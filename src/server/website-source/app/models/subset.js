import DS from 'ember-data';
import { computed } from '@ember/object';

export default DS.Model.extend({
    label:         DS.attr('string'),
    description:   DS.attr('string'),
    usedBy:        DS.hasMany('method', { inverse: 'appliedOn' }),
    resultedIn:    DS.belongsTo('method', { inverse: 'produced' }),
    documents:     DS.hasMany('document'),
    documentCount: DS.attr('number'),
    modified:      DS.attr('boolean', { defaultValue: false }),

    isRoot: computed('id', function () {
        return this.get('id') === '0';
    })
});
