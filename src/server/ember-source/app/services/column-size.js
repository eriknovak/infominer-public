import Service from '@ember/service';

export default Service.extend({

    // set col-lg values
    setColumnsWidth(components, maxColNum, viewSize) {
        for (let i = 0; i < components.length; i += maxColNum) {
            let length =  components.slice(i, i + maxColNum).length;
            for (let j = 0; j < length; j++) {
                components[i+j].class = `col-${viewSize}-${12/length}`;
            }
        }
    }

});
