// extend from graph component
import GraphComponent from '../graph-component/component';
import { once } from '@ember/runloop';
import { observer, set } from '@ember/object';

// d3 visualizations
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { axisBottom } from 'd3-axis';
import { format } from 'd3-format';
import { line, curveStepAfter } from 'd3-shape';

// declare new graph component
const TimelineComponent = GraphComponent.extend({
    // component attributes
    classNames: ['timeline'],

    /**
     * Object containing the timeline information.
     */
    data: null,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'margin', { top: 10, right: 10, bottom: 20, left: 10 });
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // prepare the data
        this._prepareTimeline(this.get('timeline'));
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    /**
     * Prepares the data used to generate the histogram.
     * @param {Object} histogram - The histogram data used to create the
     * histogram visualization.
     */
    _prepareTimeline(timeline) {
        let data = [];
        this.set('data', data);
    },

    dataObserver: observer('data', 'width', 'height', function () {
        once(this, '_redrawGraph');
    }),

    _redrawGraph() {
        let self = this;
        self.drawGraph();
    },

    drawGraph() {
        // get the container size
        let totalWidth = this.get('width');
        let totalHeight = this.get('height');
        let margin = this.get('margin');

        // set content dimensions
        let width = totalWidth - margin.left - margin.right;
        let height = totalHeight - margin.top - margin.bottom;

        // get histogram data
        let data = this.get('data');

        // get the svg element - contains the visualization components
        let container = select(this.element);
        // remove previous g components
        container.selectAll('g').remove();

        // create a new wordcloud
        select(this.element)
            .attr('width', width)
            .attr('height', height)
          .append('g')
            .attr('transform', `translate(${width/2}, ${height/2})`)
          .append('text')
            .attr('text-anchor', 'middle')
            .attr('class', 'small')
            .text('Work in progress...')
            .style('font-size', '12px');
    }

});

// add positional parameters
TimelineComponent.reopenClass({
    positionalParams: ['timeline']
});

// export timeline component
export default TimelineComponent;