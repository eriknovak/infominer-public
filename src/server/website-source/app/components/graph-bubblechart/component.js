// extend from graph component
import GraphComponent from '../graph-component/component';
import { scheduleOnce } from '@ember/runloop';
import { observer, set } from '@ember/object';

// d3 visualizations
import { select } from 'd3-selection';
import { scaleThreshold } from 'd3-scale';
import { pack, hierarchy } from 'd3-hierarchy';

// declare new graph component
const WordCloudComponent = GraphComponent.extend({
    // component attributes
    classNames: ['bubblechart'],

    /**
     * Object containing the histogram information.
     */
    data: null,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'margin', { top: 10, right: 10, bottom: 10, left: 10 });
    },

    didReceiveAttrs() {
        this._super(...arguments);
        this._setBubbleData(this.get('bubblechart'));
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    dataObserver: observer('data', 'width', 'height', function () {
        let self = this;
        scheduleOnce('afterRender', function () { self.drawGraph(); });
    }),
    
    _setBubbleData(bubblechart) {
        this.set('data', bubblechart);
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

        // calculates the size of the bubble
        function bubbleSize(node) {
            return Math.min(width, height) / 600 * node.value + 16;
        }
        // calculates the size of the text within the bubble
        function fontSize(node) {
            return 18 / 100 * node.value + 10;
        }

        // create a new histogram container
        let content = container
            .attr('width', totalWidth)
            .attr('height', totalHeight);

        // color scale for bubbles
        const colorBubble = scaleThreshold()
            .domain([100/3, 200/3])
            .range(["#e7e7e7", "#3366CC", "#000000"]);
        
        // color scale for text
        const colorText = scaleThreshold()
            .domain([100/3, 200/3])
            .range(["#000000", "#FFFFFF", "#FFFFFF"]);

        const dataPack = pack()
            .size([width, height])
            .padding(1.5)
            .radius(bubbleSize);

        const root = hierarchy({ children: data })
            .sum(d => d.precent);
            
        let node = content.selectAll(".node")
          .data(dataPack(root).leaves())
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`);
      
        node.append("circle")
            .attr("id", d => d.data.value)
            .attr("r", d => d.r)
            .style("fill", d => colorBubble(d.value));

        node.append("clipPath")
            .attr("id", d => `${this.get('elementId')}-${d.data.value}`);

        node.append("text")
              .attr('fill', d => colorText(d.value))
              .attr("clip-path", d => `${this.get('elementId')}-${d.data.value}`)
            .selectAll("tspan")
            .data(d => [{ name: d.data.value, value: d.value }, { name: d.data.frequency, value: d.value }])
            .enter().append("tspan")
              .attr("x", 0)
              .attr("y", (d, i, nodes) => 18 + (i - nodes.length / 2 - 0.5) * 12)
              .attr('text-anchor', 'middle')
              .style('text-transform', 'uppercase')
              .style('font-size', (d, i) => i===0 ? `${fontSize(d)}px` : '10px')
              .text(d => d.name);
    }

});

// add positional parameters
WordCloudComponent.reopenClass({
    positionalParams: ['bubblechart']
});
// export wordcloud component
export default WordCloudComponent;