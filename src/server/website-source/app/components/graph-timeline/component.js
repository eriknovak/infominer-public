// extend from graph component
import GraphComponent from '../graph-component/component';
import { once } from '@ember/runloop';
import { observer, set } from '@ember/object';

// d3 visualizations
import { select } from 'd3-selection';
import { scaleTime, scaleLinear } from 'd3-scale';
import interpolatePath from 'npm:d3-interpolate-path';
import { transition } from 'd3-transition';

import { axisBottom, axisLeft } from 'd3-axis';
import { format } from 'd3-format';
import { timeSecond, timeMinute, timeHour, timeDay, timeMonth, timeWeek, timeYear } from 'd3-time';
import { timeFormat } from 'd3-time-format';
import { line, curveLinear } from 'd3-shape';
import { extent } from 'd3-array';


// declare new graph component
const TimelineComponent = GraphComponent.extend({
    // component attributes
    classNames: ['graph--timeline'],

    /**
     * Object containing the timeline information.
     */
    data: null,
    aggregate: null,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'margin', { top: 35, right: 15, bottom: 20, left: 15 });
        set(this, 'aggregate', 'days');
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // prepare the data
        this._prepareTimeline(this.get('timeline'));
    },

    actions: {
        changeAggregate(type) {
            if (this.get('aggregate') !== type) {
                this.set('aggregate', type);
            }
        }
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    /**
     * Prepares the data used to generate the timeline.
     * @param {Object} timeline - The timeline data used to create the
     * timeline visualization.
     */
    _prepareTimeline(timeline) {
        this.set('data', timeline.count);
    },

    dataObserver: observer('data', 'width', 'height', function () {
        this.set('buttonPosition', this.get('width') - 130);
        once(this, '_redrawGraph');
    }),

    typeObserver: observer('aggregate', function () {
        once(this, '_changeGraph');
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

        // the total dimensions of component are invalid
        if (!totalWidth || !totalHeight) { return; }

        // set content dimensions
        let width = totalWidth - margin.left - margin.right;
        let height = totalHeight - margin.top - margin.bottom;

        // get the svg element - contains the visualization components
        let container = select(this.element);
        // remove previous g components
        container.selectAll('g').remove();

        // create a new wordcloud
        let content = select(this.element)
            .attr('width', width)
            .attr('height', height)
          .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // get timeline data
        let data = this.get('data');
        let aggregate = this.get('aggregate');

        // set horizontal scale
        let xScale = scaleTime()
            .domain(extent(data[aggregate].values, d => new Date(d.date)))
            .range([0, width - margin.left])
            .nice();

        // set vertical scale
        let yScale = scaleLinear()
            .domain([0, data[aggregate].max])
            .rangeRound([height, 0])
            .nice();

        /**************************************************
         * Timeline
         **************************************************/

        // intitialize timeline
        let timeline = line()
            .x(d => xScale(new Date(d.date)))
            .y(d => yScale(d.value))
            .curve(curveLinear);

        let chart = content.append('g')
            .attr('class', 'chart')
            .attr('transform', `translate(${margin.left},0)`);

        // draw the timeline
        chart.append('path')
            .datum(data[aggregate].interpolate)
            .attr('class', 'timeline')
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
            .attr('stroke-width', 1.5)
            .attr('d', timeline);

        // chart.selectAll('.point')
        //     .data(data[aggregate])
        //   .enter().append('circle')
        //     .attr('class', 'point')
        //     .attr('r', 2)
        //     .attr('fill', 'steelblue')
        //     .attr('cx', d => xScale(new Date(d.date)))
        //     .attr('cy', d => yScale(d.value));

        /**************************************************
         * Axis
         **************************************************/

        const formatMillisecond = timeFormat(".%L"),
            formatSecond = timeFormat(":%S"),
            formatMinute = timeFormat("%I:%M"),
            formatHour = timeFormat("%I %p"),
            formatDay = timeFormat("%a %d"),
            formatWeek = timeFormat("%b %d"),
            formatMonth = timeFormat("%b"),
            formatYear = timeFormat("%Y");

        function multiFormat(date) {
            return (timeSecond(date) < date ? formatMillisecond
                : timeMinute(date) < date ? formatSecond
                : timeHour(date) < date ? formatMinute
                : timeDay(date) < date ? formatHour
                : timeMonth(date) < date ? (timeWeek(date) < date ? formatDay : formatWeek)
                : timeYear(date) < date ? formatMonth
                : formatYear)(date);
        }

        // set horizontal axis
        chart.append('g')
            .attr('transform', `translate(0,${height})`)
            .attr("class", "x axis")
            .call(axisBottom(xScale)
                .ticks(width < 400 ? 5 : 10)
                .tickFormat(multiFormat)
            );

        // set vertical axis
        chart.append('g')
            .style('font-family', 'Open Sans')
            .attr("class", "y axis")
            .call(axisLeft(yScale)
                .ticks(height < 400 ? 5 : 10)
                .tickFormat(tick => { return tick <= 10 ? tick : format(".2s")(tick); })
            );
    },

    _changeGraph() {
        // get the container size
        let totalWidth = this.get('width');
        let totalHeight = this.get('height');
        let margin = this.get('margin');

        // set content dimensions
        let width = totalWidth - margin.left - margin.right;
        let height = totalHeight - margin.top - margin.bottom;

        // get the svg element - contains the visualization components
        let container = select(this.element);
        let chart = container.select('.chart');
        // get timeline data
        let data = this.get('data');
        let aggregate = this.get('aggregate');

        // set horizontal scale
        let xScale = scaleTime()
            .domain(extent(data[aggregate].values, d => new Date(d.date)))
            .rangeRound([0, width - margin.left])
            .nice();

        // set vertical scale
        let yScale = scaleLinear()
            .domain([0, data[aggregate].max])
            .rangeRound([height, 0])
            .nice();

        /**************************************************
         * Timeline
         **************************************************/

        // intitialize timeline
        let timeline = line()
            .x(d => xScale(new Date(d.date)))
            .y(d => yScale(d.value))
            .curve(curveLinear);

        let path = timeline(data[aggregate].interpolate);

        chart.selectAll('.timeline')
            .transition()
            .duration(500)
            .attrTween('d', function () {
                var previous = select(this).attr('d');
                return interpolatePath.interpolatePath(previous, path);
            });

        // let points = chart.selectAll('.point')
        //     .data(data[aggregate]);

        // points.exit().remove();

        // points
        //     .transition()
        //     .duration(500)
        //     .attr('cx', d => xScale(new Date(d.date)))
        //     .attr('cy', d => yScale(d.value));

        // points.enter().append('circle')
        //     .attr('class', 'point')
        //     .attr('r', 2)
        //     .attr('fill', 'steelblue')
        //     .attr('cx', d => xScale(new Date(d.date)))
        //     .attr('cy', d => yScale(d.value));


        /**************************************************
         * Axis
         **************************************************/

        // set horizontal axis
        chart.selectAll('.x.axis')
            .transition()
            .duration(500)
            .call(axisBottom(xScale)
                .ticks(width < 400 ? 5 : 10)
                .tickSizeOuter(0)
            );

        // set vertical axis
        chart.selectAll('.y.axis')
            .transition()
            .duration(500)
            .call(axisLeft(yScale)
                .ticks(height < 400 ? 5 : 10)
                .tickFormat(tick => { return tick <= 10 ? tick : format(".2s")(tick); })
                .tickSizeOuter(0)
            );
    }

});

// add positional parameters
TimelineComponent.reopenClass({
    positionalParams: ['timeline']
});

// export timeline component
export default TimelineComponent;