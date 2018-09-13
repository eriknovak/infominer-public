import DS from 'ember-data';
import { computed } from '@ember/object';
import { mapBy, max } from '@ember/object/computed';

export default DS.Model.extend({
    label: DS.attr('string'),
    description: DS.attr('string'),
    created: DS.attr('date'),
    loaded: DS.attr('boolean'),

    numberOfDocuments: DS.attr('number'),

    hasSubsets: DS.hasMany('subset', { inverse: null }),
    hasMethods: DS.hasMany('method', { inverse: null }),

    fields: DS.attr()
});
