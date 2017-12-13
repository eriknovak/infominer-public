import Component from '@ember/component';
import { observer } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['graph'],
    tagName: 'svg',

    // container size
    attributeBindings: ['width', 'height'],
    width: 0,
    height: 0,

    // resize timer - for window resize
    resizeTimer: null,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didInsertElement() {
        let self = this;
        this._super(...arguments);
        // set element width
        self.handleResize();
        // set window resize listener
        Ember.$(window).on('resize', function () {
            clearTimeout(self.get('resizeTimer'));
            self.set('resizeTimer', setTimeout(function () {
                self.handleResize();
            }, 100));
        });
    },

    willDestroyElement() {
        this._super(...arguments);
        Ember.$(window).off('resize');
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    // listener to changes of `width`, `height` and `data`
    containerSizeChange: observer('width', 'height', 'data', function () {
        Ember.run.once(this, 'drawGraph');
    }),

    /**
     * Resizes the width and height.
     */
    handleResize() {
        this.set('width', Ember.$(this.element).width());
        this.set('height', Ember.$(this.element).height());
    },

    /**
     * Draws the graph
     */
    drawGraph() { }
});
