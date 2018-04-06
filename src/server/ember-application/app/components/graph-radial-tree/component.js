// extend from graph component
import GraphComponent from '../graph-component/component';
import { inject as service } from '@ember/service';
import { observer, computed, set } from '@ember/object';

// d3 visualizations
import { select, event } from 'd3-selection';
import { stratify, tree } from 'd3-hierarchy';
import { linkRadial } from 'd3-shape';
import { transition } from 'd3-transition';


// declare new graph component
const RadialTreeComponent = GraphComponent.extend({
    // component attributes
    classNames: ['radial-tree'],

    // services
    store: service('store'),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'margin', { top: 50, right: 50, bottom: 50, left: 50 });
        this.get('hierarchy');
    },

    didRender() {
        this._super(...arguments);
        

    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////


    /**
     * Adds the subset to the hierarchy tree
     * @param {Object} subset - The subset object.
     * @param {Object[]} hierarchy - The hierarchy structure list.
     * @private
     */
    _addSubsetToHierarchy(subset, hierarchy) {
        // push the subset information to the hierarchy tree
        let id = `subset-${subset.get('id')}`;
        let parentId = `method-${subset.get('resultedIn').get('id')}`;


        // filter oout appropriate methods
        let methods =  subset.get('usedBy').filter(method => {
            return method.get('methodType').includes('clustering') ||
                   method.get('methodType').includes('filter');
        });

        hierarchy.push({ label: subset.get('label'), type: 'subset',
            numberOfDocuments: subset.get('documentCount'), id, parentId });

        // iterate through all methods - add them and their children to the tree
        for (let i = 0; i < methods.length; i++) {
            this._addMethodToHierarchy(methods.objectAt(i), hierarchy);
        }

    },

    /**
     * Adds the method to the hierarchy tree
     * @param {Object} method - The method object.
     * @param {Object[]} hierarchy - The hierarchy structure list.
     * @private
     */
    _addMethodToHierarchy(method, hierarchy) {
        // push the method information to the hierarchy tree
        let id = `method-${method.get('id')}`;
        let parentId = `subset-${method.get('appliedOn').get('id')}`;
        hierarchy.push({ label: method.get('methodType'), type: 'method', id, parentId });

        // check the type of the method
        if (method.get('methodType').includes('clustering')) {
            // method does not have any results at the moment
            if (!method.get('result')) { return; }
            // method is a clustering method - get all results
            for (let i = 0; i < method.get('result.clusters').length; i++) {

                let cluster = method.get('result.clusters').objectAt(i);
                if (cluster.subsetCreated) {
                    let subset = this.get('store').peekRecord('subset', cluster.subsetId);
                    this._addSubsetToHierarchy(subset, hierarchy);
                } else {
                    let numberOfDocuments = cluster.documentCount;
                    hierarchy.push({ label: cluster.clusterLabel, type: 'subset',
                        numberOfDocuments, id: `${id}-${i}`, parentId: id });
                }
            }
        } else if (method.get('methodType').includes('filter')) {
            // method is a filtering method - again get all results
            for (let i = 0; i < method.get('produced.length'); i++) {
                let subset = method.get('produced').objectAt(i);
                this._addSubsetToHierarchy(subset, hierarchy);
            }
        }
    },

    /**
     * Computes the hierarchy tree list each time a change happens.
     */
    hierarchy: computed('subset.{label,usedBy.@each.result}', function () {
        // create an array of parent-child relationships
        let hierarchy = [];
        // get subset information and id
        let subset = this.get('subset');

        // push the subset information to the hierarchy tree
         let id = `subset-${subset.get('id')}`;
        // first iteration need to have parentId = null
         hierarchy.push({ label: subset.get('label'), type: 'subset',
            numberOfDocuments: subset.get('documentCount'), id, parentId: null });

        // filter out appropriate methods
        let methods = this.get('usedBy').filter(method => {
            return method.get('methodType').includes('clustering') ||
                   method.get('methodType').includes('filter');
        });

        // iterate through all methods - add them and their children to the tree
        for (let i = 0; i < methods.length; i++) {
            this._addMethodToHierarchy(methods.objectAt(i), hierarchy);
        }
        // return the hierarchy prepared for consumption
        return stratify().id(d => d.id)
            .parentId(d => d.parentId)(hierarchy);
    }),

    hierarchyUpdated: observer('hierarchy', 'width', 'height', function () {
        let self = this;
        Ember.run.scheduleOnce('afterRender', function () { self.drawGraph(); });
    }),

    drawGraph() {
        let self = this;
        // helper function for calculating the radial point
        function radialPoint(x, y) {
            return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
        }

        /**
         * Calcluate node size based on the number of documents the subset contains.
         * @param {Number} numberOfDocuments - The number documents in the subset.
         */
        function nodeSize(numberOfDocuments) {
            let maxSize = self.get('subset.documentCount');
            return Math.max(numberOfDocuments / maxSize * 10, 2.5);
        }

        // get hierarchy data
        let hierarchy = this.get('hierarchy');

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

        // create the container and content
        let content = container
            .attr('width', totalWidth)
            .attr('height', totalHeight)
          .append('g')
            .attr('class', 'content')
            .attr('transform', `translate(${totalWidth / 2},${totalHeight / 2})`);


        // create radial tree
        let radialTree = tree()
            .size([2*Math.PI, (height < width ? height : width) / 2])
            .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

        let root = radialTree(hierarchy);

        let link = content.selectAll('.link')
            .data(root.links())
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', linkRadial().angle(d => d.x).radius(d => d.y));

        let node = content.selectAll('.node')
            .data(root.descendants())
            .enter().append('g')
            .attr('class', d => `node ${(d.children ? 'node-internal' : 'node-leaf')} ${d.data.type}`)
            .attr('x', d => radialPoint(d.x, d.y)[0])
            .attr('y', d => radialPoint(d.x, d.y)[1])
            .attr('transform', d => `translate(${radialPoint(d.x, d.y)})`);

        node.append('circle')
            .attr('r', d => d.data.numberOfDocuments ? nodeSize(d.data.numberOfDocuments) : 3);

        let foreignObjects = node.append('foreignObject')
            .attr('x', d => {
                if (!d.parent) { return radialPoint(d.x, d.y)[0]; }
                return d.x < Math.PI === !d.children ? 8 : -100;
            })
            .attr('y', d => {
                if (!d.parent) { return radialPoint(d.x, d.y)[1]; }
                return !(d.x < Math.PI / 2 || Math.PI * 3 / 2 < d.x)  === !d.children ? 0 : -25;
            })
            .attr('width', 150);


        let htmlDOMs = foreignObjects.append('xhtml:body')
            .style('margin', 0)
            .style('padding', 0);

        let htmlContainers = htmlDOMs.append('div')
            .attr('class', 'description')
            .html((d, i) => {
                return d.data.type === 'subset' && !(d.parent && d.children) ? `
                    <span class="title">${d.data.label}</span><br>
                    <span class="attribute-label">documents</span> =
                    <span class="attribute-value">${d.data.numberOfDocuments}</span>
                ` : '';
            });

        

        function relax() {
            let again = false;
            let spaceh = 150;
            let spacev = 28;
            let alpha = 0.5;

            node.each(function (d1, i) {
                let a = this;
                let da = select(a);
                let radial_a = radialPoint(d1.x, d1.y);
                let dac = da.selectAll('foreignObject');
                let x1 = radial_a[0] + parseFloat(dac.attr('x'));
                let y1 = radial_a[1] + parseFloat(dac.attr('y'));
                // get object height
                let da_height = dac.select('body').style('height');

                node.each(function (d2, j) {
                    let b = this;
                    // a & b are the same element and don't collide.
                    if (a == b) return;
                    let db = select(b);
                    let radial_b = radialPoint(d2.x, d2.y);
                    let dbc = db.selectAll('foreignObject');
                    // get object height
                    let db_height = dbc.select('body').style('height');
                    
                    // a & b are on opposite sides of the chart and don't collide
                    if (dac.attr('x') !== dbc.attr('x')) return;
                    // Now let's calculate the distance between these elements
                    let x2 = radial_b[0] + parseFloat(dbc.attr('x'));
                    let y2 = radial_b[1] + parseFloat(dbc.attr('y'));

                    let deltaX = x1 - x2;
                    let deltaY = y1 - y2;
                    // Our spacing is greater than our specified spacing,
                    // so they don't collide
                    if (Math.abs(deltaX) > Math.max(da_height, db_height) || Math.abs(deltaY) > spacev) return;

                    // If the labels collide, we'll push each
                    // of the two labels up and down a little bit.
                    again = true;
                    let sign = deltaY > 0 ? 1 : -1;
                    let adjust = sign * alpha;
                    dac.attr("y", parseFloat(dac.attr('y')) + adjust);
                    dbc.attr("y", parseFloat(dbc.attr('y')) - adjust);
                });
            });
            // Adjust our line leaders here
            // so that they follow the labels.
            if(again) { setTimeout(relax, 20); }
        }

        // start relaxing
        relax();
    }

});

// add positional parameters
RadialTreeComponent.reopenClass({
    positionalParams: ['radial-tree']
});

// export histogram component
export default RadialTreeComponent;