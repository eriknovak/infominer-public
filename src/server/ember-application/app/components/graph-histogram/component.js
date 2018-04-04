// extend from graph component
import GraphComponent from '../graph-component/component';
import { set } from '@ember/object';

// d3 visualizations
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { format } from 'd3-format';
import { line, curveStepAfter } from 'd3-shape';

// declare new graph component
const HistogramComponent = GraphComponent.extend({
    // component attributes
    classNames: ['histogram'],

    /**
     * Object containing the histogram information.
     */
    data: null,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'margin', { top: 10, right: 15, bottom: 20, left: 35 });
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // prepare the data
        this._prepareHistogram(this.get('histogram'));
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
        let values = [ ];
        for (let i = 0; i < hValues.length; i++) {
            let hist = hValues[i];
            values.push({
                min: min + i*step,
                max: min + (i+1)*step,
                frequency: hist.frequency,
                percent: (hist.precent / 100).toFixed(2),
                percentSum: (hist.percentSum / 100).toFixed(2)
            });
        }
        // prepare histogram data
        let data = { min, max, values };
        // set the data
        this.set('data', data);
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

        // create a new histogram container
        let content = container
            .attr('width', totalWidth)
            .attr('height', totalHeight)
          .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // set horizontal scale - values between min and max
        let xScale = scaleLinear()
            .domain([data.min, data.max])
            .rangeRound([0, width]);

        // set vertical scale - percent attribute
        let yScale = scaleLinear()
            .domain([0, 1])
            .range([height, 0]);


        /**************************************************
         * Background shading
         **************************************************/

        // initialize percent sum outline
        let percentSumOutline = line()
            .x(d => xScale(d.min))
            .y(d => yScale(d.percentSum))
            .curve(curveStepAfter);

        // add first and last points to the path
        let pathValues = data.values.slice();
        pathValues.push({ min: data.max, percentSum: 0 });
        pathValues = [{ min: data.min, percentSum: 0 }].concat(pathValues);

        // create the outline of percentSum
        content.append('path')
            .datum(pathValues)
            .attr('class', 'percentSumOutline')
            .attr('d', percentSumOutline);


        /**************************************************
         * Cumulative sum of the percentage attribute
         **************************************************/

        // // create the percentage sum histogram placeholder
        // let percentSum = content.selectAll('.percentSum')
        //     .data(data.values)
        //   .enter().append('g')
        //     .attr('class', 'percentSum')
        //     .attr('transform', (d) => `translate(${xScale(d.min)},${yScale(d.percentSum)})`);

        // // create histogram rectangle
        // percentSum.append('rect')
        //     .attr('x', 0)
        //     .attr('width', xScale(data.values[0].max) - xScale(data.values[0].min))
        //     .attr('height', (d) => height - yScale(d.percentSum));


        /**************************************************
         * Percentage attributes
         **************************************************/

        // create the percentage histogram placeholder
        let percent = content.selectAll('.percent')
            .data(data.values)
          .enter().append('g')
            .attr('class', 'percent')
            .attr('transform', (d) => `translate(${xScale(d.min)},${yScale(d.percent)})`);

        // create histogram rectangle
        percent.append('rect')
            .attr('x', 0)
            .attr('width', xScale(data.values[0].max) - xScale(data.values[0].min))
            .attr('height', (d) => height - yScale(d.percent));


        /**************************************************
         * Percentage attributes
         **************************************************/

        // set frequency format
        function formatCount(value) {
            return Math.floor(value/1000) > 0 ? format('.3s')(value) : value;
        }

        // add frequency info to each rectangle
        percent.append('text')
            .attr('class', 'frequency')
            .attr('dy', '.75em')
            .attr('y', (d) => {
                let squareHight = height - yScale(d.percent);
                return squareHight > 20 ? 6 : -12;
            })
            .attr('x', (xScale(data.values[0].max) - xScale(data.values[0].min)) / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', (d) => {
                let squareHight = height - yScale(d.percent);
                return squareHight > 20 ? 'white' : '#2C3539';
            })
            .text((d) => { return d.frequency ? formatCount(d.frequency) : ''; });


        /**************************************************
         * Axis
         **************************************************/

        // set vertical axis
        content.append('g')
            .call(axisLeft(yScale).ticks(5).tickFormat(format('.0%')));

        // set horizontal axis
        content.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(axisBottom(xScale).ticks(5).tickFormat(tick => { return tick <= 10 ? tick : format(".2s")(tick); }));
    }

});

// add positional parameters
HistogramComponent.reopenClass({
    positionalParams: ['histogram']
});

// export histogram component
export default HistogramComponent;