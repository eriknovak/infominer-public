import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['unsaved', 'child'],
    classNameBindings: ['subset', 'method'],
    subset: false,
    method: false,

    didReceiveAttrs() {
        this._super(...arguments);

        // set class bindings based on type
        switch (this.get('type')) {
            case 'subset': this.set('subset', true); break;
            case 'method': this.set('method', true); break;
            default: break;
        }
    }

});
