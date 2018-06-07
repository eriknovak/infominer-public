// extend from graph component
import GraphComponent from '../graph-component/component';
import { scheduleOnce } from '@ember/runloop';
import { observer, set } from '@ember/object';

// d3 visualizations
import { select } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { format } from 'd3-format';
import { interpolateRgb } from 'd3-interpolate';
import d3ScaleChromatic from 'npm:d3-scale-chromatic';
import { hierarchy, treemap, treemapResquarify } from 'd3-hierarchy';

// declare new graph component
const HierarchyComponent = GraphComponent.extend({
    // component attributes
    classNames: ['hierarchy'],

    /**
     * Object containing the histogram information.
     */
    data: null,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'margin', { top: 0, right: 0, bottom: 0, left: 0 });
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // prepare the data
        this._preparehierarchy(this.get('hierarchy'));
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    /**
     * Prepares the data used to generate the histogram.
     * @param {Object} hierarchy - The histogram data used to create the
     * histogram visualization.
     */
    _preparehierarchy(hierarchy) {
        let data = { name: 'root', children: hierarchy };
        // set the data
        this.set('data', data);
    },

    dataObserver: observer('data', 'width', 'height', function () {
        let self = this;
        scheduleOnce('afterRender', function () { self.drawGraph(); });
    }),

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

        // create a new histogram container
        let content = container
            .attr('width', totalWidth)
            .attr('height', totalHeight)
          .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // set horizontal scale - values between min and max
        const fader = (color) => { return interpolateRgb(color, '#fff')(0.2); };
        const color = scaleOrdinal(d3ScaleChromatic.schemeCategory10.map(fader));

        /**************************************************
         * Background shading
         **************************************************/

        let treemapFunction = treemap()
            .tile(treemapResquarify)
            .size([width, height])
            .round(true)
            .paddingInner(1);

        let root = hierarchy(data)
            .eachBefore(d => { 
                d.data.id = (d.parent ? d.parent.data.id + '.' : '') + d.data.name; 
            })
            .sum(d => Math.sqrt(d.size))
            .sort((a, b) => b.height - a.height || b.value - a.value);
      
        treemapFunction(root);
      
        let cell = content.selectAll('g')
          .data(root.leaves())
          .enter().append('g')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);
      
        cell.append('rect')
            .attr('id', d => `${this.get('elementId')}-${d.data.id}`)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => color(d.data.id.split('.')[1]));
      
        cell.append('clipPath')
            .attr('id', d => `clip-${this.get('elementId')}-${d.data.id}`)
          .append('use')
            .attr('xlink:href', d => `#${this.get('elementId')}-${d.data.id}`);
      
        cell.append('text')
            .attr('clip-path', d => `url(#clip-${this.get('elementId')}-${d.data.id}`)
          .selectAll('tspan')
            .data(d => `${d.data.id}.${d.data.size}`.split('.').slice(1))
          .enter().append('tspan')
            .attr('x', 4)
            .attr('y', (d, i) => 14 + i * 14)
            .text(d => d);
      
        cell.append('title')
            .text(d => `category: ${d.data.id.split('.').slice(1).join(' 🡒 ')}\ncount: ${format('.0f')(d.data.size)}`);
    }

});

// add positional parameters
HierarchyComponent.reopenClass({
    positionalParams: ['hierarchy']
});

// export histogram component
export default HierarchyComponent;