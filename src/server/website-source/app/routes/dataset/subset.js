import Route from '@ember/routing/route';
import $ from 'jquery';

export default Route.extend({

    model(params) {
        // set a on scroll listener
        $(window).on('scroll', function () {
            // change display if the user scrolled down enough
            let display = $(document).scrollTop() > 500  ? 'block' : 'none';
            $('#go-to-top').css('display', display);
        });
        // get the subset info
        return this.get('store').peekRecord('subset', params.subset_id);
    },

    actions: {

        /**
         * Submits the changes to the subset information.
         */
        editSubset() {
            // get subset label and description
            let label = $('#edit-subset-modal input').val();
            let description = $('#edit-subset-modal textarea').val();

            // get warning and clean container
            let warningContent = $('#edit-subset-modal div.warning');
            warningContent.empty();

            if (label.length === 0) {
                // TODO: handle data omitence
                warningContent.append('<p class="warning-content">Subset label must be given!</p>');
            } else {
                $('#edit-subset-modal').modal('toggle');
                // get the current subset
                let subset = this.modelFor(this.routeName);

                // set the subset information
                subset.set('label', label);
                subset.set('description', description);

                // save the subset for persistance
                subset.save();
            }
        },

        /**
         * Removes the warning message within the subset creation model
         */
        removeModalWarnings() {
            // get warning container
            let warningContent = $('#edit-subset-modal div.warning');
            // empty warning container
            warningContent.empty();
        },

        deleteSubset() {
            // hide modals
            $('#delete-subset-modal').modal('toggle');
            $('#edit-subset-modal').modal('toggle');

            let subset = this.modelFor(this.routeName);
            if (parseInt(subset.get('id')) !== 0) {
                // this subset is the root subset - cannot delete it
                this._destroySubset(subset);
                let datasetId = parseInt(this.modelFor('dataset').get('id'));
                this.transitionTo('dataset.subset.analysis', datasetId, 0);
            }
        },

        /**
         * Moves the window to the top of the page, smoothly.
         */
        backToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

    },

    _destroySubset(subset) {
        // iterate throught methods that use the subset
        if (subset.get('usedBy.length')) {
            for (let i = 0; i < subset.get('usedBy.length'); i++) {
                let method = subset.get('usedBy').objectAt(i);
                this._destroyMethod(method);
            }
        }
        // destroy the record
        subset.destroyRecord();
    },

    _destroyMethod(method) {
        // iterate throught methods that use the subset
        if (method.get('produced.length')) {
            for (let i = 0; i < method.get('produced.length'); i++) {
                let subset = method.get('produced').objectAt(i);
                this._destroySubset(subset);
            }
        }
        // destroy the record
        method.destroyRecord();
    }
});
