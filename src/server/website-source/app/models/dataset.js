import DS from 'ember-data';
import { computed } from '@ember/object';

export default DS.Model.extend({
    label: DS.attr('string'),
    description: DS.attr('string'),
    created: DS.attr('date'),
    status: DS.attr('string'),

    numberOfDocuments: DS.attr('number'),

    hasSubsets: DS.hasMany('subset', { inverse: null }),
    hasMethods: DS.hasMany('method', { inverse: null }),

    fields: DS.attr(),
    selectedFields: DS.attr(),
    ready: computed('status', function () {
        return this.get('status') === 'finished';
    })
});
