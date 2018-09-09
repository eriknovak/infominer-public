import DS from 'ember-data';
import { computed } from '@ember/object';

export default DS.Model.extend({
    methodType: DS.attr('string'),
    parameters: DS.attr('object', { defaultValue: null }),
    result: DS.attr('object', { defaultValue: null }),
    produced: DS.hasMany('subset', { inverse: 'resultedIn' }),
    appliedOn: DS.belongsTo('subset', { inverse: 'usedBy' }),
    analysisAppropriate: computed('methodType', function () {
        return !this.get('methodType').includes('filter');
    }),
    label: computed('methodType', function () {
        if (this.get('methodType').includes('kmeans')) {
            return 'clustering';
        } else if (this.get('methodType').includes('filter.manual')) {
            return 'query-filter';
        } else {
            return this.get('methodType');
        }
    })
});
