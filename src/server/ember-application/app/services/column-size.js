import Service from '@ember/service';

export default Service.extend({

    /**
     * Sets the columnWidth to each of the component.
     * @param {Array} components - Array of components.
     * @param {Number} maxColNum - The maximum number of columns in one row.
     * @param {String} viewSize  - The view size. Possible: `lg`, `md`, `sm`, `xs`.
     */
    setColumnsWidth(components, maxColNum, viewSize) {
        // go through components
        for (let i = 0; i < components.length; i += maxColNum) {
            let length =  components.slice(i, i + maxColNum).length;
            for (let j = 0; j < length; j++) {
                let columnSize = `col-${viewSize}-${12/length}`;
                Ember.set(components.objectAt(i+j), `column${viewSize}`, columnSize);
            }
        }
    }

});
