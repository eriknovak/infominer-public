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
import { timeDay, timeMonth, timeYear } from 'd3-time';
import { timeFormat } from 'd3-time-format';
import { line, curveMonotoneX } from 'd3-shape';
import { extent } from 'd3-array';


// declare new graph component
const TimelineComponent = GraphComponent.extend({
    // component attributes
    classNames: ['timeline'],

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

        let data = {
            days:   [],
            months: [],
            years:  []
        };

        // year and month data container
        let year  = { date: null, value: 0 },
            month = { date: null, value: 0 };

        for (let date of timeline.date) {
            let d = new Date(date.interval);

            data.days.push({ date: timeFormat('%Y-%m-%d')(d), value: date.frequency });

            let yearMonthDay = date.interval.split('-');
            // update years data
            if (year.date !== yearMonthDay[0]) {
                if (year.date) {
                    // add current year to the list
                    let yClone = Object.assign({}, year);
                    data.years.push(yClone);
                }
                year.date = timeFormat('%Y')(d);
                year.value = date.frequency;
            } else {
                // update the year value
                year.value += date.frequency;
            }

            // update months data
            let yearMonth = yearMonthDay.slice(0, 2).join('-');
            if (month.date !== yearMonth) {
                if (month.date) {
                    let mClone = Object.assign({}, month);
                    data.months.push(mClone);
                }
                month.date = timeFormat("%Y-%m")(d);
                month.value = date.frequency;
            } else {
                // update the month value
                month.value += date.frequency;
            }
        }

        // add last year and month element
        data.years.push(year);
        data.months.push(month);

        this.set('data', data);
    },

    dataObserver: observer('data', 'width', 'height', function () {
        this.set('buttonPosition', this.get('width') - 135);
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
            .domain(extent(data[aggregate], d => new Date(d.date)))
            .range([0, width - margin.left])
            .nice();

        let ticks = [];
        if (aggregate === 'days') {
            ticks = xScale.ticks(timeDay);
        } else if (aggregate === 'months') {
            ticks = xScale.ticks(timeMonth);
        } else if (aggregate === 'years') {
            ticks = xScale.ticks(timeYear);
        }

        // set vertical scale
        const max = data[aggregate].map(el => el.value)
            .reduce((acc, curr) => Math.max(acc, curr), 0);

        let yScale = scaleLinear()
            .domain([0, max])
            .rangeRound([height, 0])
            .nice();

        /**************************************************
         * Timeline
         **************************************************/

        // intitialize timeline
        let timeline = line()
            .x(d => xScale(new Date(d.date)))
            .y(d => yScale(d.value))
            .curve(curveMonotoneX);

        let interpolated = ticks.map(tick => {
            let tickDate = new Date(tick);
            let tickCompare = null;
            if (aggregate === 'days') {
                tickCompare = timeFormat('%Y-%m-%d')(tickDate);
            } else if (aggregate === 'months') {
                tickCompare = timeFormat('%Y-%m')(tickDate);
            } else if (aggregate === 'years') {
                tickCompare = timeFormat('%Y')(tickDate);
            }
            return data[aggregate].find(el => {
                return tickCompare === el.date;
            }) || { date: tick, value: 0 };
        });

        let chart = content.append('g')
            .attr('class', 'chart')
            .attr('transform', `translate(${margin.left},0)`);

        // draw the timeline
        chart.append('path')
            .datum(interpolated)
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

        // set horizontal axis
        chart.append('g')
            .attr('transform', `translate(0,${height})`)
            .attr("class", "x axis")
            .call(axisBottom(xScale)
                .ticks(width < 400 ? 5 : 10)
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
            .domain(extent(data[aggregate], d => new Date(d.date)))
            .rangeRound([0, width - margin.left])
            .nice();

        let ticks = [];
        if (aggregate === 'days') {
            ticks = xScale.ticks(timeDay);
        } else if (aggregate === 'months') {
            ticks = xScale.ticks(timeMonth);
        } else if (aggregate === 'years') {
            ticks = xScale.ticks(timeYear);
        }

        // set vertical scale
        const max = data[aggregate].map(el => el.value)
            .reduce((acc, curr) => Math.max(acc, curr), 0);

        let yScale = scaleLinear()
            .domain([0, max])
            .rangeRound([height, 0])
            .nice();

        /**************************************************
         * Timeline
         **************************************************/

        let interpolated = ticks.map(tick => {
            let tickDate = new Date(tick);
            let tickCompare = null;
            if (aggregate === 'days') {
                tickCompare = timeFormat('%Y-%m-%d')(tickDate);
            } else if (aggregate === 'months') {
                tickCompare = timeFormat('%Y-%m')(tickDate);
            } else if (aggregate === 'years') {
                tickCompare = timeFormat('%Y')(tickDate);
            }
            return data[aggregate].find(el => {
                return tickCompare === el.date;
            }) || { date: tick, value: 0 };
        });

        // intitialize timeline
        let timeline = line()
            .x(d => xScale(new Date(d.date)))
            .y(d => yScale(d.value))
            .curve(curveMonotoneX);

        let path = timeline(interpolated);

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