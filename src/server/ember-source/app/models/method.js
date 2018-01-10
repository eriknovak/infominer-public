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
    })
});
