import DS from 'ember-data';
import { computed } from '@ember/object';

export default DS.Model.extend({
    methodType: DS.attr('string'),
    parameters: DS.attr('object', { defaultValue: null }),
    result: DS.attr('object', { defaultValue: null }),
    produced: DS.hasMany('subset', { inverse: 'resultedIn' }),
    appliedOn: DS.belongsTo('subset', { inverse: 'usedBy' }),

    analysisAppropriate: computed('methodType', function () {
        return this.get('methodType') ? !this.get('methodType').includes('filter') : true;
    }),

    label: computed('methodType', function () {
        if (this.get('methodType').includes('clustering')) {
            return 'clustering';
        } else if (this.get('methodType').includes('filter.manual')) {
            return 'document query';
        } else if (this.get('methodType').includes('classify.active-learning')){
            return 'active learning';
        } else {
            return this.get('methodType');
        }
    })
});
