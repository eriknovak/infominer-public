// extend from graph component
import GraphComponent from '../graph-component/component';
import { scheduleOnce } from '@ember/runloop';
import { observer, set } from '@ember/object';

// d3 visualizations
import { select } from 'd3-selection';
import { scaleQuantize } from 'd3-scale';
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
        set(this, 'margin', { top: 20, right: 20, bottom: 20, left: 20 });
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
            return Math.min(width, height) / 240 * node.value + 12;
        }
        // calculates the size of the text within the bubble
        function fontSize(node) {
            return 30 / 100 * node.value + 10;
        }

        // create a new histogram container
        let content = container
            .attr('width', totalWidth)
            .attr('height', totalHeight);

        // color scale for bubbles
        const colorBubble = scaleQuantize()
            .domain([0, Math.min(width, height) / 2.4 + 12])
            .range(["#e7e7e7", "#3366CC", "#000000"]);
        
        // color scale for text
        const colorText = scaleQuantize()
            .domain([0, 40])
            .range(["#000000", "#FFFFFF", "#FFFFFF"]);

        const dataPack = pack()
            .size([totalWidth, totalHeight])
            .padding(1.5)
            .radius(bubbleSize);

        const root = hierarchy({ children: this.get('data') })
            .sum(d => d.precent);
            
        let node = content.selectAll(".node")
          .data(dataPack(root).leaves())
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`);
      
        node.append("circle")
            .attr("id", d => d.data.value)
            .attr("r", d => d.r)
            .style("fill", d => colorBubble(bubbleSize(d)));


        node.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'central')
            .attr('fill', d => colorText(fontSize(d)))
            .style('font-size', d => `${fontSize(d)}px`)
            .style('text-transform', 'uppercase')
            .text(d => d.data.value);
            
      
    }

});

// add positional parameters
WordCloudComponent.reopenClass({
    positionalParams: ['bubblechart']
});
// export wordcloud component
export default WordCloudComponent;