import Component from '@ember/component';
import { get, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({

    actions: {
    // toggle field inclusion
        toggleFieldInclusion() {
            const included = this.get('features.included');
            set(this.get('features'), 'included', !included);
        }
    }
});
