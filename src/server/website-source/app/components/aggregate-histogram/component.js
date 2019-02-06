import Component from '@ember/component';
import saveSvg from 'npm:save-svg-as-png';
import $ from 'jquery';

export default Component.extend({
    // component attributes
    classNames: ['aggregate', 'aggregate-histogram'],
    classNameBindings: ['maximize'],

    maximize: false,
    cover: null,

    actions: {
        maximizeComponent() {
            this.toggleProperty('maximize');

            if (this.get('maximize')) {
                let cover = document.createElement('div');
                cover.style.height = '100%';
                cover.style.width = '100%';
                cover.style.backgroundColor = 'black';
                cover.style.opacity = '0.5';
                cover.style.position = 'fixed';
                cover.style.top = '0px';
                cover.style.left = '0px';
                cover.style.zIndex = '1100';

                this.set('cover', cover);
                document.body.appendChild(cover);
            } else {
                let cover = this.get('cover');
                document.body.removeChild(cover);
            }
        },

        saveImage() {
            // save the component
            saveSvg.saveSvgAsPng(
                $(`#${this.get('elementId')} svg.graph`)[0],
                `aggregate-histogram-${this.get('elementId')}`,
                { backgroundColor: 'white' }
            );
        }

    }
});
