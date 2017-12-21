import Component from '@ember/component';

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
        self._handleResize();
        // set window resize listener
        Ember.$(window).on('resize', function () {
            clearTimeout(self.get('resizeTimer'));
            self.set('resizeTimer', setTimeout(function () {
                self._handleResize();
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

    /**
     * Resizes the width and height.
     */
    _handleResize() {
        this.set('width', Ember.$(this.element).width());
        this.set('height', Ember.$(this.element).height());
        this.drawGraph();
    },

    /**
     * Draws the graph
     */
    drawGraph() { }
});
