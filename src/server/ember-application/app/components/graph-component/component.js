import Component from '@ember/component';
import { observer } from '@ember/object';
import $ from 'jquery';

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
        // set element width
        self._super(...arguments);
        self._handleResize();
        // set window resize listener
        $(window).on('resize', function () {
            clearTimeout(self.get('resizeTimer'));
            self.set('resizeTimer', setTimeout(function () {
                Ember.run.scheduleOnce('afterRender', function () { self._handleResize(); });
            }, 500));
        });
    },

    willDestroyElement() {
        this._super(...arguments);
        $(window).off('resize');
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    /**
     * Resizes the width and height.
     */
    _handleResize() {
        let self = this;
        this.set('width', $(this.element).width());
        this.set('height', $(this.element).height());
    },

    resizeObserver: observer('width', 'height', function () {
        // Ember.run.once(this, 'drawGraph');
    }),

    /**
     * Draws the graph
     */
    drawGraph() { }
});
