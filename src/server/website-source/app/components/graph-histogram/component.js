// extend from graph component
import GraphComponent from '../graph-component/component';
import { once } from '@ember/runloop';
import { computed, observer, get, set } from '@ember/object';

// d3 visualizations
import { select } from 'd3-selection';
import { scaleLinear, scaleLog } from 'd3-scale';
import { transition } from 'd3-transition';

import { axisBottom } from 'd3-axis';
import { format } from 'd3-format';
import { line, curveStepAfter } from 'd3-shape';

// declare new graph component
const HistogramComponent = GraphComponent.extend({
    // component attributes
    classNames: ['graph--histogram'],

    /**
     * Object containing the histogram information.
     */
    data: null,
    type: null,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'margin', { top: 35, right: 15, bottom: 20, left: 15 });
        set(this, 'type', 'linear');
        get(this, 'valueType');
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // prepare the data
        this._prepareHistogram(this.get('histogram'));
    },

    actions: {
        changeType(type) {
            if (this.get('type') !== type) {
                this.set('type', type);
            }
        }
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    /**
     * Prepares the data used to generate the histogram.
     * @param {Object} histogram - The histogram data used to create the
     * histogram visualization.
     */
    _prepareHistogram(histogram) {
        // prepare histogram data
        let min = histogram.min;
        let max = histogram.max;
        let hValues = histogram.values;
        // caluculate the step function
        let step = (max - min)/hValues.length;
        // calculate histogram values
        let values = { wide: [ ], narrow: [] };
        for (let i = 0; i < hValues.length; i++) {
            let hist = hValues[i];
            values.wide.push({
                min: min + i*step,
                max: min + (i+1)*step,
                frequency: hist.frequency,
                linear: hist.frequency ? parseFloat((hist.precent / 100).toFixed(2)) + 0.015 : 0,
                log: hist.frequency + 1
            });
            // join two together
            if (i % 2 === 0) {
                let frequency = hValues[i].frequency + hValues[i+1].frequency;
                let percent = hValues[i].precent + hValues[i+1].precent;

                values.narrow.push({
                    min: min + i*step,
                    max: min + (i+2)*step,
                    frequency: frequency,
                    linear: frequency ? parseFloat((percent / 100).toFixed(2)) + 0.015 : 0,
                    log: frequency + 1
                });
            }
        }
        // prepare histogram data
        let data = { min, max, values };
        // set the data
        this.set('data', data);
    },

    dataObserver: observer('data', 'width', 'height', function () {
        this.set('buttonPosition', this.get('width') - 75);
        once(this, '_redrawGraph');
    }),

    typeObserver: observer('type', function () {
        once(this, '_changeGraph');
    }),

    valueType: computed('width', function () {
        return this.get('width') <= 300 ? 'narrow' : 'wide';
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

        // get histogram data
        let data = this.get('data');
        let type = this.get('type');

        // set horizontal scale - values between min and max
        let xScale = scaleLinear()
            .domain([data.min, data.max])
            .rangeRound([0, width])
            .nice();

        // determine which aggregate of data to take
        let valueType = this.get('valueType');

        // set vertical scale - percent attribute
        let yScale = null;
        if (type === 'linear') {
            yScale = scaleLinear()
                .domain([0, 1])
                .range([height, 0])
                .nice();
        } else if (type === 'log') {
            const max =  data.values[valueType].map(el => el.log)
                .reduce((acc, curr) => Math.max(acc, curr), 1);
            yScale = scaleLog()
                .domain([1, max])
                .range([height, 0])
                .nice();
        }

        /**************************************************
         * Background shading
         **************************************************/

        // initialize percent sum outline
        let percentOutline = line()
            .x(d => xScale(d.min))
            .y(d => yScale(d[type]))
            .curve(curveStepAfter);

        // add first and last points to the path
        let pathValues = data.values[valueType].slice();
        pathValues.push({ min: data.max, linear: 0, log: 1 }); // last point
        pathValues.push({ min: data.min, linear: 0, log: 1 }); // first point

        // create the outline of percent
        content.append('path')
            .datum(pathValues)
            .attr('class', 'percentOutline')
            .attr('d', percentOutline)
            .style('fill', '#3366CC');

        /**************************************************
         * Percentage attributes
         **************************************************/

        // create the percentage histogram placeholder
        let percent = content.selectAll('.percent')
            .data(data.values[valueType])
          .enter().append('g')
            .attr('class', 'percent')
            .attr('transform', (d) => `translate(${xScale(d.min)},${yScale(d[type])})`);

        // set frequency format
        function formatCount(value) {
            return Math.floor(value/1000) > 0 ? format('.3s')(value) : value;
        }

        // add frequency info to each rectangle
        percent.append('text')
            .attr('class', 'frequency')
            .attr('dy', '.75em')
            .attr('y', d => height - yScale(d[type]) > 20 ? 6 : -12)
            .attr('x', (xScale(data.values[valueType][0].max) - xScale(data.values[valueType][0].min)) / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', d => height - yScale(d[type]) > 20 ? 'white' : '#2C3539')
            .text(d => d.frequency ? formatCount(d.frequency) : '')
            .style('font-family', 'Open Sans')
            .style('font-size', '9px');


        /**************************************************
         * Axis
         **************************************************/

        // set horizontal axis
        content.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(axisBottom(xScale)
                .ticks(width < 400 ? 5 : 10)
                .tickFormat(tick => tick <= 10 ? tick : format(".2s")(tick))
            );
    },


    /**
     * make the transitions from one type of graph to another.
     */
    _changeGraph() {
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

        // set horizontal scale - values between min and max
        let xScale = scaleLinear()
            .domain([data.min, data.max])
            .rangeRound([0, width])
            .nice();

        // scale type
        let type = this.get('type');
        // determine which aggregate of data to take
        let valueType = this.get('valueType');

        // set vertical scale - percent attribute
        let yScale = null;

        if (type === 'linear') {
            yScale = scaleLinear()
                .domain([0, 1])
                .range([height, 0])
                .nice();
        } else if (type === 'log') {
            const max =  data.values[valueType].map(el => el.log)
                .reduce((acc, curr) => Math.max(acc, curr), 1);
            yScale = scaleLog()
                .domain([1, max])
                .range([height, 0])
                .nice();
        }
        /**************************************************
         * Background shading
         **************************************************/

        // initialize percent sum outline
        let percentOutline = line()
            .x(d => xScale(d.min))
            .y(d => yScale(d[type]))
            .curve(curveStepAfter);

        // add first and last points to the path
        let pathValues = data.values[valueType].slice();
        pathValues.push({ min: data.max, linear: 0, log: 1 }); // last point
        pathValues.push({ min: data.min, linear: 0, log: 1 }); // first point

        // create and move the outline
        let path = percentOutline(pathValues);
        container.selectAll('.percentOutline')
            .transition()
            .duration(500)
            .attr('d', path);

        /**************************************************
         * Percentage attributes
         **************************************************/

        // move the percentage container
        let percent = container.selectAll('.percent')
            .data(data.values[valueType])
            .transition()
            .duration(500)
            .attr('transform', d => `translate(${xScale(d.min)},${yScale(d[type])})`);


        // move frequency info to each rectangle
        percent.selectAll('.frequency')
            .transition()
            .duration(500)
            .attr('y', d => height - yScale(d[type]) > 20 ? 6 : -12)
            .attr('x', (xScale(data.values[valueType][0].max) - xScale(data.values[valueType][0].min)) / 2)
            .attr('fill', d => height - yScale(d[type]) > 20 ? 'white' : '#2C3539');

    }

});

// add positional parameters
HistogramComponent.reopenClass({
    positionalParams: ['histogram']
});

// export histogram component
export default HistogramComponent;