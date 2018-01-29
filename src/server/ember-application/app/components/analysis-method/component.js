import Component from '@ember/component';
import { computed } from '@ember/object';
export default Component.extend({
    // component attributes
    classNames: ['row', 'analysis'],

    methodComponent: computed('method.{methodType,result}', function () {
         // get type of the method
         let type = this.get('method.methodType');
         // prepare component name based on the type
         let methodComponent = `analysis-method-${type.replace(/\./g, '-')}`;
         if (!this.get('method.result')) { methodComponent += '-placeholder'; }
         return methodComponent;
    })

});
